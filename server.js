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

    const vulnerablePorts = [137, 139, 445, 535, 3389, 23, 80, 53];
    let portCommand = os.platform() === "win32" ? "netstat -ano | findstr LISTENING" : "ss -tuln";
    let userCommand = os.platform() === "win32" ? "wmic useraccount get name" : "cut -d: -f1 /etc/passwd";
    let firewallCommand = os.platform() === "win32" ? "netsh advfirewall show allprofiles" : "sudo ufw status";

    exec(portCommand, (error, portOutput) => {
        if (error) return res.json({ result: `Error scanning ports: ${error.message}` });
        
        let openPorts = portOutput.split("\n").map(line => {
            let match = line.match(/:(\d+)/);
            return match ? parseInt(match[1]) : null;
        }).filter(port => port && vulnerablePorts.includes(port));

        let portReport = openPorts.length > 0 ? `⚠️ Vulnerable Ports Found: ${openPorts.join(", ")}` : "✅ No Vulnerable Ports Found.";
        
        exec(userCommand, (error, userOutput) => {
            if (error) return res.json({ result: `Error retrieving users: ${error.message}` });
            let users = userOutput.split("\n").map(user => user.trim()).filter(user => user);
            let userReport = `👤 Users on System:\n${users.join("\n")}`;

            exec(firewallCommand, (error, firewallOutput) => {
                if (error) return res.json({ result: `Error checking firewall: ${error.message}` });
                let firewallStatus = firewallOutput.toLowerCase().includes("on") || firewallOutput.toLowerCase().includes("active") ? "✅ Firewall is Enabled." : "⚠️ Firewall is Disabled!";
                
                res.json({ result: `${portReport}\n\n${userReport}\n\n${firewallStatus}` });
            });
        });
    });
});

app.listen(3000, () => console.log("🚀 Server running at: http://localhost:3000"));