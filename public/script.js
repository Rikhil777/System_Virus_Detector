document.getElementById("scanButton").addEventListener("click", () => {
    document.getElementById("status").innerText = "Scanning... Please wait.";
    document.getElementById("output").innerText = "";

    fetch("/scan")
        .then(response => response.json())
        .then(data => {
            document.getElementById("status").innerText = "Scan Completed ✅";
            document.getElementById("output").innerText = data.result;
        })
        .catch(error => {
            document.getElementById("status").innerText = "Scan Failed ❌";
            document.getElementById("output").innerText = "Error: " + error;
        });
});
