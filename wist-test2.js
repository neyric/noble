
var noble = require('./index')

noble.onStateChange('poweredOn');

noble.startScanning([], false, function() { console.log(arguments); });

setTimeout(function () {

  noble.stopScanning();
  noble.on('discover', function(peripheral) { console.log(peripheral); });

  var p = noble._peripherals.fe97eb742fe5;
  if(!p) {
    console.log(Object.keys(noble._peripherals));
    return console.log('_peripherals.fe97eb742fe5 not found');
  }

  p.on('disconnect', function() { console.log('disconnect'); });

  p.connect(function (error) {

      noble._bindings._gatts.fe97eb742fe5._aclStream.encrypt();

      setTimeout(function() {

	p.discoverAllServicesAndCharacteristics(function (error, discoveredServices) {

	  setTimeout(function() {
		console.log('Writing 0 on LinkLoss');
		p.services[4].characteristics[0].write(new Buffer([0]), false);
          }, 5000);

        });

      }, 5000);

  });


}, 5000);
