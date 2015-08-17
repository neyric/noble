var util = require('util'),
  noble = require('../index'),
  Characteristic = noble.ServerCharacteristic,
  PrimaryService = noble.ServerPrimaryService;

/**
 * Characteristic
 */
var timer = null;

function ImmediateAlertLevelCharacteristic() {
  ImmediateAlertLevelCharacteristic.super_.call(this, {
    uuid: '2A06',
    properties: ['writeWithoutResponse'],
    descriptors: []
  });
}

util.inherits(ImmediateAlertLevelCharacteristic, Characteristic);

ImmediateAlertLevelCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {

  console.log('ImmediateAlertLevelCharacteristic write', data, offset, withoutResponse);

  var v = data.readUInt8(0);

  if(v == 2 || v == 1) {
    timer = setInterval(function() { console.log('bip bip bip'); }, 1000);
  }
  else if (v == 0) {
    if(timer) {
      clearInterval(timer);
      timer = null;
    }
  }
  else {
    console.log('unknown value v', v);
  }

  callback(this.RESULT_SUCCESS);
};


/**
 * Service
 */
function ImmediateAlertService() {
  ImmediateAlertService.super_.call(this, {
      uuid: '1802',
      characteristics: [
          new ImmediateAlertLevelCharacteristic()
      ]
  });
}

util.inherits(ImmediateAlertService, PrimaryService);

module.exports = ImmediateAlertService;
