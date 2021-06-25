// const express = require("express");
// const socketIO = require("socket.io");
const chalk = require("chalk");
const port = 3700;

const {
    AttributeIds,
    OPCUAClient,
    TimestampsToReturn,
    MessageSecurityMode,
    SecurityPolicy,
} = require("node-opcua");

const endpointUrl = "opc.tcp://trungpd:4334/UA/WeatherStation";
// const nodeIdToMonitor = "ns=1;s=London-Pressure";
const dataWeather = ["Temperature", "Humidity", "Pressure", "Weather"];

(async () => {
    try {
        const connectionStrategy = {
            initialDelay: 1000,
            maxRetry: 1
        }

        const client = OPCUAClient.create({
            applicationName: "MyClient",
            connectionStrategy: connectionStrategy,
            securityMode: MessageSecurityMode.None,
            securityPolicy: SecurityPolicy.None,
            endpointMustExist: false,
        });
        client.on("backoff", (retry, delay) => {
            console.log("Retrying to connect to ", endpointUrl, " attempt ", retry);
        });
        console.log(" connecting to ", chalk.cyan(endpointUrl));
        await client.connect(endpointUrl);
        console.log(" connected to ", chalk.cyan(endpointUrl));

        const session = await client.createSession();
        console.log(" session created".yellow);

        const subscription = await session.createSubscription2({
            requestedPublishingInterval: 1000,
            requestedMaxKeepAliveCount: 20,
            requestedLifetimeCount: 6000,
            maxNotificationsPerPublish: 1000,
            publishingEnabled: true,
            priority: 10
        });

        subscription.on("keepalive", function () {
            console.log("keepalive");
        }).on("terminated", function () {
            console.log(" TERMINATED ------------------------------>")
        });

        // --------------------------------------------------------
        // const app = express();
        // app.set('view engine', 'html');
        // app.use(express.static(__dirname + '/'));
        // app.set('views', __dirname + '/');
        // app.get("/", function (req, res) {
        //     res.render('index.html');
        // });

        // app.use(express.static(__dirname + '/'));

        // const io = socketIO(app.listen(port));

        // io.sockets.on('connection', function (socket) {
        // });

        // console.log("Listening on port " + port);
        // console.log("visit http://localhost:" + port);
        // // --------------------------------------------------------

        // const itemToMonitor = {
        //     nodeId: nodeIdToMonitor,
        //     attributeId: AttributeIds.Value
        // };
        const parameters = {
            samplingInterval: 100,
            discardOldest: true,
            queueSize: 100
        };
        // const monitoredItem = await subscription.monitor(itemToMonitor, parameters, TimestampsToReturn.Both);

        // monitoredItem.on("changed", (dataValue) => {
        //     console.log(dataValue.value.toString());
        //     io.sockets.emit('message', {
        //         value: dataValue.value.value,
        //         timestamp: dataValue.serverTimestamp,
        //         nodeId: nodeIdToMonitor,
        //         browseName: "Temperature"
        //     });
        // });

        dataWeather.map(async (data, index) => {
            const itemToMonitor = {
                nodeId: `ns=1;s=London-${data}`,
                attributeId: AttributeIds.Value
            };

            const monitoredItem = await subscription.monitor(itemToMonitor, parameters, TimestampsToReturn.Both);

            await monitoredItem.on("changed", (dataValue) => {
                console.log(`London ${data}: ` + dataValue.value.value);
                // io.sockets.emit('message', {
                //     value: dataValue.value.value,
                //     timestamp: dataValue.serverTimestamp,
                //     nodeId: itemToMonitor.nodeId,
                //     browseName: `${data}`
                // });
            });
        })


        // detect CTRL+C and close
        let running = true;
        process.on("SIGINT", async () => {
            if (!running) {
                return; // avoid calling shutdown twice
            }
            console.log("shutting down client");
            running = false;

            await subscription.terminate();

            await session.close();
            await client.disconnect();
            console.log("Done");
            process.exit(0);

        });

    }
    catch (err) {
        console.log(chalk.bgRed.white("Error" + err.message));
        console.log(err);
        process.exit(-1);
    }
})();