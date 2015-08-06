var debug = require('debug')('acl-att-stream');

var events = require('events');
var util = require('util');

var Smp = require('./smp');
var L2cap = require('./l2cap');

var AclStream = function(hci, handle, localAddressType, localAddress, remoteAddressType, remoteAddress) {
  this._hci = hci;
  this._handle = handle;
  this.encrypted = false;

  this._smp = new Smp(this, localAddressType, localAddress, remoteAddressType, remoteAddress);

  this._l2cap = new L2cap(this);

  this.onSmpStkBinded = this.onSmpStk.bind(this);
  this.onSmpFailBinded = this.onSmpFail.bind(this);
  this.onSmpEndBinded = this.onSmpEnd.bind(this);

  this._smp.on('stk', this.onSmpStkBinded);
  this._smp.on('fail', this.onSmpFailBinded);
  this._smp.on('end', this.onSmpEndBinded);
};

util.inherits(AclStream, events.EventEmitter);

AclStream.prototype.encrypt = function() {
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
  this.encrypted = encrypt ? true : false;

  this.emit('encrypt', this.encrypted);
};

AclStream.prototype.pushLtkNegReply = function() {
  this.emit('ltkNegReply');
};

AclStream.prototype.onSmpFail = function() {
  this.emit('encryptFail');
};

AclStream.prototype.onSmpEnd = function() {
  this._smp.removeListener('stk', this.onSmpStkBinded);
  this._smp.removeListener('fail', this.onSmpFailBinded);
  this._smp.removeListener('end', this.onSmpEndBinded);
};

module.exports = AclStream;
