var debug = require('debug')('smp');

var events = require('events');
var util = require('util');

var crypto = require('./crypto');

var SMP_CID = 0x0006;

var SMP_PAIRING_REQUEST = 0x01;
var SMP_PAIRING_RESPONSE = 0x02;
var SMP_PAIRING_CONFIRM = 0x03;
var SMP_PAIRING_RANDOM = 0x04;
var SMP_PAIRING_FAILED = 0x05;
var SMP_ENCRYPT_INFO = 0x06;
var SMP_MASTER_IDENT = 0x07;
var SMP_IDENT_INFO = 0x08;
var SMP_IDENT_ADDR_INFO = 0x09;
var SMP_SIGN_INFO = 0x0a;
var SMP_SECURITY_REQUEST = 0x0b;

var Smp = function(aclStream, localAddressType, localAddress, remoteAddressType, remoteAddress) {
  this._aclStream = aclStream;

  console.log('localAddressType', localAddressType);
  console.log('localAddress', localAddress);
  console.log('remoteAddressType', remoteAddressType);
  console.log('remoteAddress', remoteAddress);

  this._iat = new Buffer([(localAddressType === 'random') ? 0x01 : 0x00]);
  this._ia = new Buffer(localAddress.split(':').reverse().join(''), 'hex');
  this._rat = new Buffer([(remoteAddressType === 'random') ? 0x01 : 0x00]);
  this._ra = new Buffer(remoteAddress.split(':').reverse().join(''), 'hex');

  this._stk = null;
  this._random = null;
  this._diversifier = null;

  this.onAclStreamDataBinded = this.onAclStreamData.bind(this);
  this.onAclStreamEncryptChangeBinded = this.onAclStreamEncryptChange.bind(this);
  this.onAclStreamLtkNegReplyBinded = this.onAclStreamLtkNegReply.bind(this);
  this.onAclStreamEndBinded = this.onAclStreamEnd.bind(this);

  this._aclStream.on('data', this.onAclStreamDataBinded);
  this._aclStream.on('encryptChange', this.onAclStreamEncryptChangeBinded);
  this._aclStream.on('ltkNegReply', this.onAclStreamLtkNegReplyBinded);
  this._aclStream.on('end', this.onAclStreamEndBinded);
};

util.inherits(Smp, events.EventEmitter);


Smp.prototype.sendPairingRequest = function() {
  /*this._preq = new Buffer([
    SMP_PAIRING_REQUEST,
    0x03, // IO capability: NoInputNoOutput
    0x00, // OOB data: Authentication data not present
    0x01, // Authentication requirement: Bonding - No MITM
    0x10, // Max encryption key size
    0x00, // Initiator key distribution: <none>
    0x01  // Responder key distribution: EncKey
  ]);*/
  debug('Sending pairing request');
  this._preq = new Buffer([
    SMP_PAIRING_REQUEST,
    0x03, // IO capability: NoInputNoOutput
    0x00, // OOB data: Authentication data not present
    0x01, // Authentication requirement: Bonding - No MITM
    0x10, // Max encryption key size
    0x03, // Initiator key distribution: LTK + CSRK
    0x03  // Responder key distribution: LTK + IRK + CSRK
  ]);
  this.write(this._preq);
};

Smp.prototype.onAclStreamData = function(cid, data) {
  if (cid !== SMP_CID) {
    return;
  }

  var code = data.readUInt8(0);

  debug('Got SMP ACL message, code='+code);

  if (SMP_PAIRING_REQUEST === code) {
    this.handlePairingRequest(data);
  } else if (SMP_PAIRING_RESPONSE === code) {
    this.handlePairingResponse(data);
  } else if (SMP_PAIRING_CONFIRM === code) {
    this.handlePairingConfirm(data);
  } else if (SMP_PAIRING_RANDOM === code) {
    this.handlePairingRandom(data);
  } else if (SMP_PAIRING_FAILED === code) {
    this.handlePairingFailed(data);
  } else if (SMP_ENCRYPT_INFO === code) {
    this.handleEncryptInfo(data);
  } else if (SMP_MASTER_IDENT === code) {
    this.handleMasterIdent(data);
  } else if (SMP_SIGN_INFO === code) {
    this.handleSigningInformation(data);
  } else if (SMP_SECURITY_REQUEST === code) {
    this.handleSecurityRequest(data);
  }

};


Smp.prototype.handleSecurityRequest = function (data) {
  debug('got security request !!!');
  this._aclStream._hci.startLeEncryption(this._aclStream._handle, this._rand, this._ediv, this._ltk);
};

Smp.prototype.onAclStreamEncryptChange = function(encrypted) {
  if (encrypted) {
    if (this._stk && this._diversifier && this._random) {
      this.write(Buffer.concat([
        new Buffer([SMP_ENCRYPT_INFO]),
        this._stk
      ]));

      this.write(Buffer.concat([
        new Buffer([SMP_MASTER_IDENT]),
        this._diversifier,
        this._random
      ]));
    }
  }
};

Smp.prototype.onAclStreamLtkNegReply = function() {
    this.write(new Buffer([
      SMP_PAIRING_FAILED,
      SMP_UNSPECIFIED
    ]));

    this.emit('fail');
};

Smp.prototype.onAclStreamEnd = function() {
  this._aclStream.removeListener('data', this.onAclStreamDataBinded);
  this._aclStream.removeListener('encryptChange', this.onAclStreamEncryptChangeBinded);
  this._aclStream.removeListener('ltkNegReply', this.onAclStreamLtkNegReplyBinded);
  this._aclStream.removeListener('end', this.onAclStreamEndBinded);
};

Smp.prototype.handlePairingResponse = function(data) {

  debug('Handling pairing response');

  this._pres = data;

  this._tk = new Buffer('00000000000000000000000000000000', 'hex');
  this._r = crypto.r();

  debug('Setting _tk: '+this._tk.toString('hex'));
  debug('Setting _r: '+this._r.toString('hex'));

  this.sendPairingConfirm();
};

Smp.prototype.sendPairingConfirm = function () {
  var confirmKey = crypto.c1(this._tk, this._r, this._pres, this._preq, this._iat, this._ia, this._rat, this._ra);

  debug('Sending pairing confirm Key: '+confirmKey.toString('hex'));

  this.write(Buffer.concat([
    new Buffer([SMP_PAIRING_CONFIRM]),
    confirmKey
  ]));
};

Smp.prototype.handlePairingConfirm = function(data) {

  debug('Handle pairing confirm');

  this._pcnf = data;

  this.sendPairingRandom();
};

Smp.prototype.sendPairingRandom = function () {
  debug('Sending pairing random...');
  this.write(Buffer.concat([
    new Buffer([SMP_PAIRING_RANDOM]),
    this._r
  ]));
};

Smp.prototype.handlePairingRandom = function(data) {

  var r = data.slice(1);

  debug('Handle pairing random from slave, r = '+r.toString('hex') );

  var pcnf = Buffer.concat([
    new Buffer([SMP_PAIRING_CONFIRM]),
    crypto.c1(this._tk, r, this._pres, this._preq, this._iat, this._ia, this._rat, this._ra)
  ]);

  if (this._pcnf.toString('hex') === pcnf.toString('hex')) {

    debug('Pairing random key validated => got stk !');

    var stk = crypto.s1(this._tk, r, this._r);

    //this.emit('stk', stk);

    debug('Generated STK : '+stk.toString('hex') );

    var random = new Buffer('0000000000000000', 'hex');
    var diversifier = new Buffer('0000', 'hex');

    this._aclStream._hci.startLeEncryption(this._aclStream._handle, random, diversifier, stk);

  } else {

    debug('pairing random failed');

    this.write(new Buffer([
      SMP_PAIRING_RANDOM,
      SMP_PAIRING_CONFIRM
    ]));

    this.emit('fail');
  }
};


Smp.prototype.handlePairingFailed = function(data) {
  this.emit('fail');
};

Smp.prototype.handleEncryptInfo = function(data) {

  var ltk = data.slice(1);

  debug('handleEncryptInfo, ltk = '+ltk.toString('hex'));

  this._ltk = ltk;

  this.emit('ltk', ltk);
};

Smp.prototype.handleMasterIdent = function(data) {
  var ediv = data.slice(1, 3);
  var rand = data.slice(3);

  this._ediv = ediv;
  this._rand = rand;

  this.emit('masterIdent', ediv, rand);
};


Smp.prototype.handleSigningInformation = function(data) {
  debug('Handling Signing Information');
  var csrk = data.slice(1);

  // Reply by sending my csrk

  // Generate a new csrk
  this._csrk = crypto.r();

  this.write(Buffer.concat([
    new Buffer([SMP_SIGN_INFO]),
    this._csrk
  ]));

};


Smp.prototype.write = function(data) {
  this._aclStream.write(SMP_CID, data);
};

module.exports = Smp;
