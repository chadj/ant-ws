const Ant = require('ant-plus');
const http = require('http');
const faye = require('faye');
const ip = require('ip');
const parseArgs = require('minimist');

const sensors = {
  'hr': {
    klass: Ant.HeartRateScanner,
    instances: [],
    dataEventNames: ['hbData'],
  },
  'bike_power': {
    klass: Ant.BicyclePowerScanner,
    instances: [],
    dataEventNames: ['powerData'],
  },
  'speed_cadence': {
    klass: Ant.SpeedCadenceScanner,
    instances: [],
    dataEventNames: ['cadenceData', 'speedData'],
  },
  'fitness_equipment': {
    klass: Ant.FitnessEquipmentScanner,
    instances: [],
    dataEventNames: ['fitnessData'],
  },
  'stride_speed_distance': {
    klass: Ant.StrideSpeedDistanceScanner,
    instances: [],
    dataEventNames: ['ssdData'],
  }
};

class SensorManager {
  constructor (sensor, stickManager) {
    this.sensor = sensor;
    this.stickManager = stickManager;
  }

  scan() {
    return new Promise((resolve,reject) => {
      let executed = false;
      let listener = () => {
        this.sensor.removeListener('attached', listener);
        if(!executed) {
          executed = true;
          resolve();
        }
      }

      this.sensor.on('attached', listener);
      this.sensor.scan();
    });
  }
}

class StickManager {
  constructor (stick) {
    this.stick = stick;
  }

  startup() {
    return new Promise((resolve,reject) => {
      let executed = false;
      let listener = () => {
        this.stick.removeListener('startup', listener);
        if(!executed) {
          executed = true;
          resolve();
        }
      }

      this.stick.on('startup', listener);
      if (!this.stick.open()) {
        reject(new Error('Unable to open stick.'))
      }
    });
  }
}

const argv = parseArgs(process.argv.slice(2), {boolean: ['help','verbose'], alias: {p: 'port', h: 'help', v: 'verbose'}, default: {port: 8000}});

if(argv.help) {
  console.log("Usage: node antws.js --port 8000\n\nOptions:\n  -h, --help           Command line usage\n  -p, --port           Port to listen on\n  -v, --verbose        Verbose ant+ message logging");
} else {
  const server = http.createServer();
  const bayeux = new faye.NodeAdapter({mount: '/', timeout: 120, ping: 30});
  bayeux.attach(server);
  server.listen(parseInt(argv.port));

  console.log("ANT-WS Server URL: http://" + ip.address() + ":" + parseInt(argv.port) + "/ or http://localhost:" + parseInt(argv.port) + "/");
  console.log("CTRL-C to exit\n");

  const stickManagers = [new StickManager(new Ant.GarminStick3), new StickManager(new Ant.GarminStick2)];

  (async function() {
    let client = bayeux.getClient();

    let stickFound = false;
    for(const stickManager of stickManagers) {
      if(stickManager.stick.is_present()) {
        console.log("Found ant+ usb stick");
        await stickManager.startup();
        stickFound = true;
        console.log("Ant+ usb stick initialized.");
        for(const [name, {klass, instances, dataEventNames}] of Object.entries(sensors)) {
          const sensorManager = new SensorManager(new klass(stickManager.stick), stickManager);
          await sensorManager.scan();
          instances.push(sensorManager);
          for(const dataEventName of dataEventNames) {
            sensorManager.sensor.on(dataEventName, data => {
              data.type = name;
              data.eventName = dataEventName;
              let publication = client.publish('/'+name, {text: JSON.stringify(data)});
              if(argv.verbose) {
                console.log(Object.entries(data).map(d => d[0] + ": " + d[1]).join(", "));
              }
              console.log(JSON.stringify(data));
            });
          }
        }
        console.log("Listening for ant+ messages.");
      }
    }
    if(!stickFound) {
      console.log('No Ant+ usb stick found.  ');
    }
  })().catch(error => {
    console.log("Error: ", error);
  });
}
