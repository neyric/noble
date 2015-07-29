


var noble = require('./index')

noble.onStateChange('poweredOn');

noble.startScanning([], false, function() { console.log(arguments); });


setTimeout(function () {

  noble.stopScanning();
  noble.on('discover', function(peripheral) { console.log(peripheral); });
  //noble._peripherals.fe97eb742fe5.address;

  var p = noble._peripherals.fe97eb742fe5;

  p.connect(function (error) {

    p.discoverAllServicesAndCharacteristics(function (error, discoveredServices) {
      console.log(error, discoveredServices);

      setTimeout(function () {
        console.log('Writing 2 on ImmediateAlert');
        p.services[3].characteristics[0].write(new Buffer([2]), false);

        setTimeout(function() {
          console.log('Writing 0 on LinkLoss');
	  p.services[4].characteristics[0].write(new Buffer([0]), false);
        }, 5000);

      }, 2000);

    });

  });


}, 5000);
