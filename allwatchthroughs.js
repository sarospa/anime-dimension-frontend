displayRows = {
	"Title": {displayName: "Title", width: "45%"},
	"WatchPartner": {displayName: "Partner", width: "40%"},
	"Episode": {displayName: "Episode", width: "15%"},
}

columns = [];
data = [];

$.when($.ready).then(async function() {
	const response = await fetch(`${baseURL}/allwatchthroughs`);
	if (!response.ok) {
	  throw new Error(`Response status: ${response.status}`);
	}
	
	const result = await response.json();
	columns = result["message"]["columns"];
	data = result["message"]["rows"];
	
	const partnersResponse = await fetch(`${baseURL}/watchpartners`);
	if (!partnersResponse.ok) {
		throw new Error(`Response status: ${partnersResponse.status}`);
	}
	
	const partnersResult = await partnersResponse.json();
	let partnersList = partnersResult["message"]["rows"];
	
	let partnersDropdown = $("#partnerSearch");
	for (let row = 0; row < partnersList.length; row++) {
		let rowData = partnersList[row];
		partnersDropdown.append($(`<option value=${rowData[0]}>${rowData[1]}</option>`));
	}
	
	buildTable();
});

function find(row, column) {
	return row[columns.findIndex((col) => col === column)]
}

function search() {
	let partnerSearch = $("#partnerSearch");
	let activeCheckbox = $("#isActive");
	
	buildTable(partnerSearch.val(), activeCheckbox.prop("checked"));
}

function buildTable(partnerId, isActive) {
	let table = $("#watchthroughtable");
	table.empty();
	
	let headerRow = $("<tr>");
	for (let col = 0; col < columns.length; col++) {
		let columnName = columns[col];
		if (Object.keys(displayRows).includes(columnName)) {
			headerRow.append($(`<th style='width: ${displayRows[columnName].width}'>${displayRows[columnName].displayName}</th>`));
		}
	}
	table.append(headerRow);
	
	let isEven = true;
	for (let row = 0; row < data.length; row++) {
		if ((!partnerId || partnerId == find(data[row], "WatchPartnerId")) &&
			(!isActive || find(data[row], "IsActive") == "1")) {
			let parity = isEven ? "even" : "odd"
			isEven = !isEven;
			let rowElem = $(`<tr class='${parity}'>`);
			for (let col = 0; col < data[row].length; col++) {
				let columnName = columns[col];
				if (Object.keys(displayRows).includes(columnName)) {
					let cellData = data[row][col];
					if (columnName === "Title") {
						cellData = `<a href="/neweditwatchthrough.html?animeid=${find(data[row], "AnimeId")}&partnerid=${find(data[row], "WatchPartnerId")}">${cellData}</a>`
					}
					if (cellData === null) cellData = "";
					rowElem.append($(`<td>${cellData}</td>`));
				}
			}
			table.append(rowElem);
		}
	}
}