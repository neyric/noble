var debug = require('debug')('l2cap');

var events = require('events');
var util = require('util');

var LE_CHANNEL_CID = 0x0005;

var LE_CON_PARAM_UPDATE_REQ_CODE = 0x12;
var LE_CON_PARAM_UPDATE_RES_CODE = 0x13;

var L2cap = function(aclStream) {

  this.onAclStreamDataBinded = this.onAclStreamData.bind(this);

  this._aclStream = aclStream;
  this._aclStream.on('data', this.onAclStreamDataBinded);
};

util.inherits(L2cap, events.EventEmitter);

L2cap.prototype.onAclStreamData = function(cid, data) {
  if (cid !== LE_CHANNEL_CID) {
    return;
  }

  var code = data.readUInt8(0);
  if(code === LE_CON_PARAM_UPDATE_REQ_CODE) {
    this.handleConParamUpdateReq(data);
  }
  else {
    debug('IGNORING L2CAP Event, code = '+code);
  }

};

L2cap.prototype.handleConParamUpdateReq = function (data) {
  debug('GOT LE_CON_PARAM_UPDATE_REQ_CODE !!');

  var commandIdentifier = data.readUInt8(1);
  var LE_CON_PARAM_UPDATE_LEN =  data.readUInt16LE(2); // Should be 8

  var minInterval = data.readUInt16LE(4);
  var maxInterval = data.readUInt16LE(6);
  var slaveLatency = data.readUInt16LE(8);
  var timeoutMultiplier = data.readUInt16LE(10);

  debug('   minInterval = '+minInterval);
  debug('   maxInterval = '+maxInterval);
  debug('   slaveLatency = '+slaveLatency);
  debug('   timeoutMultiplier = '+timeoutMultiplier);

  // TODO: LL_CONNECTION_UPDATE_REQ
  this._aclStream._hci.updateLeConn(this._aclStream._handle, minInterval, maxInterval, slaveLatency, timeoutMultiplier, 0, 0);

  var response = new Buffer([
    LE_CON_PARAM_UPDATE_RES_CODE,
    commandIdentifier,
    0x02, 0x00, // Command length
    0x00, 0x00 // Move Result = Accepted
  ]);

  this.write(response);
};


L2cap.prototype.write = function(data) {
  this._aclStream.write(LE_CHANNEL_CID, data);
};

module.exports = L2cap;
