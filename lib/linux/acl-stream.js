var debug = require('debug')('acl-att-stream');

var events = require('events');
var util = require('util');

var Smp = require('./smp');

var AclStream = function(hci, handle, localAddressType, localAddress, remoteAddressType, remoteAddress) {
  this._hci = hci;
  this._handle = handle;
  this.encypted = false;

  this._smp = new Smp(this, localAddressType, localAddress, remoteAddressType, remoteAddress);

  //this._smp.on('stk', this.onSmpStk.bind(this)); // TODO: handle fail, and stream end -> unbind
};

util.inherits(AclStream, events.EventEmitter);



AclStream.prototype.write = function(cid, data) {
  this._hci.writeAclDataPkt(this._handle, cid, data);
};

AclStream.prototype.push = function(cid, data) {
  if (data) {
    this.emit('data', cid, data);
  } else {
    this.emit('end');
  }
};

AclStream.prototype.pushEncrypt = function(encrypt) {
  this.encrypted = encrypt ? true : false;

  this.emit('encryptChange', this.encrypted);
};

AclStream.prototype.pushLtkNegReply = function() {
  this.emit('ltkNegReply');
};


/*AclStream.prototype.encrypt = function() {
  this._smp.sendPairingRequest();
};

AclStream.prototype.write = function(cid, data) {
  this._hci.writeAclDataPkt(this._handle, cid, data);
};

AclStream.prototype.push = function(cid, data) {
  if (data) {
    this.emit('data', cid, data);
  } else {
    this.emit('end');
  }
};

AclStream.prototype.pushEncrypt = function(encrypt) {
  this.emit('encrypt', encrypt);
};

AclStream.prototype.onSmpStk = function(stk) {
  var random = new Buffer('0000000000000000', 'hex');
  var diversifier = new Buffer('0000', 'hex');

  this._hci.startLeEncryption(this._handle, random, diversifier, stk);
};*/

module.exports = AclStream;
