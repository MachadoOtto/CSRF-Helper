const generateButton = document.getElementById('generate-button');
const requestInput = document.getElementById('request-input');
const pocOutput = document.getElementById('poc-output');
const hiddenForm = document.getElementById('hidden-form');
const executeButton = document.getElementById('execute-button');
const pocResult = document.getElementById('poc-result');

function dissectRequest(requestValue) {
    let lines = requestValue.split("\n");
    let method = lines[0].split(" ")[0];
    let url = lines[0].split(" ")[1];
    let headers = {};
    for (let i = 1; i < lines.length; i++) {
        if (lines[i] === "") {
            break;
        }
        let header = lines[i].split(": ");
        headers[header[0]] = header[1];
    }
    let body = lines.slice(lines.indexOf("") + 1).join("\n");
    let bodyValues = {}
    if (body) {
        let bodyLines = body.split("&");
        for (let i = 0; i < bodyLines.length; i++) {
            let bodyLine = bodyLines[i].split("=");
            bodyValues[bodyLine[0]] = bodyLine[1];
        }
    }

    return { method, url, headers, body, bodyValues };
}

function generateCSRFForm(requestValue, isHTTPS) {
    try {
        let dissectedRequest = dissectRequest(requestValue);
        if (dissectedRequest.url === undefined) {
            throw "Malformed request";
        }
        let fullPath = (isHTTPS) ? "https://" : "http://";
        if (dissectedRequest.headers.Host) {
            fullPath += dissectedRequest.headers.Host;
        } else {
            throw "Host header not found";
        }
        fullPath += dissectedRequest.url;
        let pocValue = `<form action="${fullPath}" method="${dissectedRequest.method}">`;
        for (let key in dissectedRequest.bodyValues) {
            pocValue += `
            <input type="hidden" name="${key}" value="${dissectedRequest.bodyValues[key]}">`;
        }
        pocValue += `
            <input id="submit-form" type="submit" value="Submit request">
        </form>`;
        return pocValue;
    } catch (error) {
        if (error !== "Host header not found") {
            throw "Malformed request";
        } else {
            throw error;
        }
    }
}

function generateCSRFPOC(requestValue, isHTTPS) {
    let form = generateCSRFForm(requestValue, isHTTPS);
    fullPOC = `<html>
    <body>
        ${form}
    </body>
</html>`;
    return { form, fullPOC };
}

generateButton.addEventListener('click', function() {
    let requestValue = requestInput.value;
    let isHTTPS = document.getElementById('is-https').checked;
    try {
        let result = generateCSRFPOC(requestValue, isHTTPS);
        pocOutput.value = result.fullPOC;
        hiddenForm.innerHTML = result.form;
        let submitButton = document.getElementById('submit-form');
        submitButton.parentNode.removeChild(submitButton);
        executeButton.classList.remove('disabled');
    } catch (error) {
        pocOutput.value = error;
        executeButton.classList.add('disabled');
    }
});

executeButton.addEventListener('click', function() {
    document.forms[0].submit();
});

const copyButton = document.getElementById('copy-button');
const downloadButton = document.getElementById('download-button');

copyButton.addEventListener('click', function() {
    navigator.clipboard.writeText(pocOutput.value);
});

downloadButton.addEventListener('click', function() {
    let blob = new Blob([pocOutput.value], {type: 'text/html'});
    let url = URL.createObjectURL(blob);
    downloadButton.href = url;
    downloadButton.download = 'csrf-poc.html';
});