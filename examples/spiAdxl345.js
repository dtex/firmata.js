var Board = require("../");

Board.requestPort(function(error, port) {
  if (error) {
    console.log(error);
    return;
  }
  var board = new Board(port.comName);

  var register = {
    POWER: 0x2D,
    RANGE: 0x31,
    READ: 0x32,
  };

  var READ_BIT = 0x80;
  var MULTI_BYTE_BIT = 0x40;

  board.on("ready", function() {
    console.log("READY");

    var MSBFIRST = board.SPI_BIT_ORDER.MSBFIRST;
    var LSBFIRST = board.SPI_BIT_ORDER.LSBFIRST;

    var sensitivity = 0.00390625;
    var CS_START_ONLY = 0x02;
    var CS_END_ONLY = 0x04;
    var BYTES_TO_READ = 6;

    board.spiConfig();

    var deviceId = 9; // must be unique per device per application
    board.spiBeginTransaction(deviceId, {
      bitOrder: MSBFIRST,
      dataMode: board.SPI_DATA_MODES.MODE3,
      maxClockSpeed: 5000000, // 5 Mhz
      csPin: 2,
      csActiveState: board.SPI_CS_ACTIVE_STATE.LOW
    });

    // power off
    board.spiWrite([register.POWER, 0x00]);
    // power on and set measurement mode
    board.spiWrite([register.POWER, 0x08]);

    // full resolution, +/- 2g, 4-wire SPI
    board.spiWrite([register.RANGE, 0x08]);

    // setup multi-byte read
    var readAddress = register.READ | READ_BIT | MULTI_BYTE_BIT;

    var counter = 100; // read 100 times
    var interval = setInterval(function() {
      // set CS LOW and write READ register
      board.spiWrite([readAddress], CS_START_ONLY);

      // read 6 bytes then set CS HIGH
      board.spiRead(BYTES_TO_READ, CS_END_ONLY, function(data) {
        var x = (data[1] << 8) | data[0];
        var y = (data[3] << 8) | data[2];
        var z = (data[5] << 8) | data[4];

        // Wrap and clamp 16 bits;
        var X = (x >> 15 ? ((x ^ 0xFFFF) + 1) * -1 : x) * sensitivity;
        var Y = (y >> 15 ? ((y ^ 0xFFFF) + 1) * -1 : y) * sensitivity;
        var Z = (z >> 15 ? ((z ^ 0xFFFF) + 1) * -1 : z) * sensitivity;

        console.log("X: " + X + " Y: " + Y + " Z: " + Z);
      });

      if (--counter === 0) {
        clearInterval(interval);
        console.log("done");
      }
    }, 100);


    // get debug messages from board
    board.on("string", function (message) {
      console.log("message from board: " + message);
    });

  });
});