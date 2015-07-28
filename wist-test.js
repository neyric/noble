


var noble = require('./index')

noble.onStateChange('poweredOn');

noble.startScanning([], false, function() { console.log(arguments); });


setTimeout(function () {

  noble.stopScanning();
  noble.on('discover', function(peripheral) { console.log(peripheral); });
  //noble._peripherals.fe97eb742fe5.address;

  noble._peripherals.fe97eb742fe5.connect(function (error) {

    noble._peripherals.fe97eb742fe5.discoverAllServicesAndCharacteristics(function (error, discoveredServices) {
      console.log(error, discoveredServices);

      setTimeout(function () {
        noble._peripherals.fe97eb742fe5.services[3].characteristics[0].write(new Buffer([2]), false);
      }, 2000);

    });

  });


}, 5000);
