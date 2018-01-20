# ANT-WS

ANT-WS is a simple server written in javascript for Node.js that when combined with an ANT+ usb stick can relay all ant+ messages in range over a websocket to browser based clients.  ANT-WS relies upon the [ant-plus](https://github.com/Loghorn/ant-plus) Node.js package for handling low level serial communication with the ant+ usb stick.

## Prerequisites

The [usb](https://github.com/tessel/node-usb) module is included as a dependency and maybe have special prerequisites depending on your platform.
##### Windows
On Windows please follow the [instructions](https://github.com/chadj/ant-ws/wiki/Windows-Prerequisites) in the wiki.  
##### Mac OS
No special steps are required on Mac OS.
##### Linux
On Linux, you'll need libudev to build the [usb](https://github.com/tessel/node-usb) module. On Ubuntu/Debian: `sudo apt-get install build-essential libudev-dev`.

## Installation

1. Install [Node.js](https://nodejs.org/)
1. Download and unpack the [ANT-WS](https://github.com/chadj/ant-ws/archive/master.zip) zip file
1. Open a command prompt and switch directory to the unzipped folder
1. Run the command `npm install`
1. Start the server with `node antws.js`

## Command line help

```
$ node antws.js --help
Usage: node antws.js --port 8000

Options:
  -h, --help           Command line usage
  -p, --port           Port to listen on
  -v, --verbose        Verbose ant+ message logging
```

## Client Usage

ANT-WS uses [Faye](https://faye.jcoglan.com/) as the underlying transport to relay ANT+ messages to browser based clients.

Include the client script from the ANT-WS server at:  http://localhost:8000/client.js

```html
<script type="text/javascript" src="http://localhost:8000/client.js"></script>
```

Subscribe to and receive ant messages

```javascript
var client = new Faye.Client('http://localhost:8000/');
client.subscribe('/bike_power', msg => {
    const ant = JSON.parse(msg.text);
}
```

The following topics are exposed and correspond to an ANT+ device type:

* hr
* bike_power
* speed_cadence
* fitness_equipment
* stride_speed_distance

An example ANT+ messages:
```json
{
  "offset":0,
  "DeviceID":1,
  "Cadence":165,
  "AccumulatedPower":50374,
  "Power":283,
  "type":"bike_power",
  "eventName":"powerData"
}
```
