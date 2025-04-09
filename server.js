const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const os = require("os");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/scan", (req, res) => {
    console.log("🔍 Scan request received...");

    const platform = os.platform(); // 'win32', 'linux', 'darwin'
    const vulnerablePorts = [137, 139, 445, 535, 3389, 23, 80, 53];

    let portCommand, userCommand, firewallCommand;

    if (platform === "win32") {
        portCommand = 'netstat -ano | findstr LISTENING';
        userCommand = 'wmic useraccount get name';
        firewallCommand = 'netsh advfirewall show allprofiles';
    } else {
        portCommand = 'ss -tuln';
        userCommand = 'cut -d: -f1 /etc/passwd';
        firewallCommand = 'sudo ufw status';
    }

    // 🔍 Start port scan
    exec(portCommand, (portError, portOutput) => {
        if (portError) {
            return res.json({ result: `Error scanning ports: ${portError.message}` });
        }

        let openPorts = portOutput.split("\n").map(line => {
            let match = line.match(/:(\d+)/);
            return match ? parseInt(match[1]) : null;
        }).filter(port => port && vulnerablePorts.includes(port));

        let portReport = openPorts.length > 0
            ? `⚠️ Vulnerable Ports Found: ${openPorts.join(", ")}`
            : "✅ No Vulnerable Ports Found.";

        // 👤 Get users
        exec(userCommand, (userError, userOutput) => {
            if (userError) {
                return res.json({ result: `Error retrieving users: ${userError.message}` });
            }

            let users = userOutput.split("\n")
                .map(user => user.trim())
                .filter(user => user && !user.includes("Name") && !user.includes("="));

            let userReport = `👤 Users on System:\n${users.join("\n")}`;

            // 🔒 Check firewall
            exec(firewallCommand, (fwError, fwOutput) => {
                if (fwError) {
                    return res.json({ result: `Error checking firewall: ${fwError.message}` });
                }

                let firewallStatus = fwOutput.toLowerCase().includes("on") || fwOutput.toLowerCase().includes("active")
                    ? "✅ Firewall is Enabled."
                    : "⚠️ Firewall is Disabled!";

                // 🧾 Final Response
                res.json({
                    result: `${portReport}\n\n${userReport}\n\n${firewallStatus}`
                });
            });
        });
    });
});

app.listen(3000, () => console.log("🚀 Server running at: http://localhost:3000"));
