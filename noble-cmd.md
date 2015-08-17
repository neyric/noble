
====================

````js
sudo DEBUG=hci,bindings,smp,att,l2cap node

var noble = require('./index')

noble.onStateChange('poweredOn');

noble.startScanning([], false, function() { console.log(arguments); });


noble.stopScanning();

noble.on('discover', function(peripheral) { console.log(peripheral); });

noble._peripherals.fe97eb742fe5.address



noble._peripherals.fe97eb742fe5.connect(function (error) { console.log("[Wistiki] Connected", error); });

noble._peripherals.fe97eb742fe5.discoverAllServicesAndCharacteristics(function (error, discoveredServices) { console.log(error, discoveredServices); });



// Immediate Alert:
noble._peripherals.fe97eb742fe5.services[3].characteristics[0].write(new Buffer([2]), true);

// Link Loss 0
noble._peripherals.fe97eb742fe5.services[4].characteristics[0].write(new Buffer([0]), false);

// Wistiki-73096593702
````

===================

    sudo DEBUG=hci,bindings,smp,att,l2cap node wist-test

===================

    sudo DEBUG=hci,bindings,smp,att,l2cap node

```js
require('./wist-test2')
var noble = require('./index')
noble._peripherals.fe97eb742fe5.services[3].characteristics[0].write(new Buffer([2]), true);
```



noble._bindings._gatts.fe97eb742fe5._aclStream.encrypt();


======================


sudo DEBUG=hci,bindings,smp,att,gap,l2cap NOBLE_REPORT_ALL_HCI_EVENTS=1 node wist-test2.js




Ce qu'il manque encore :

 * Reconnection à partir du LTK
 * Gestion des réponses att



var noble = require('../index');
var p = noble._peripherals.fe97eb742fe5;
p.connect(function (error) { console.log('connected', error); });
