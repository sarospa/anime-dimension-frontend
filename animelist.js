displayRows = {
	"Title": {displayName: "Title", width: "35%"},
	"Notes": {displayName: "Notes", width: "30%"},
	"YuriRatingId": {displayName: "Yuri Rating", width: "5%"},
	"ReleaseDate": {displayName: "Release Date", width: "5%"},
	"LastEpisode": {displayName: "Last Episode", width: "5%"},
	"Source": {displayName: "Source", width: "5%"},
	"Priority": {displayName: "Priority", width: "5%"}
}
columns = [];
data = [];
partnersList = [];

$.when($.ready).then(async function() {
	try {
		const response = await fetch(`${baseURL}/allanime`);
		if (!response.ok) {
		  throw new Error(`Response status: ${response.status}`);
		}
		
		const result = await response.json();
		columns = result["message"]["columns"];
		data = result["message"]["rows"]
		
		const partnersResponse = await fetch(`${baseURL}/watchpartners`);
		if (!partnersResponse.ok) {
			throw new Error(`Response status: ${partnersResponse.status}`);
		}
		
		const partnersResult = await partnersResponse.json();
		partnersList = partnersResult["message"]["rows"];
		
		let partnersDropdown = $("#partnerSearch");
		for (let row = 0; row < partnersList.length; row++) {
			let rowData = partnersList[row];
			partnersDropdown.append($(`<option value=${rowData[0]}>${rowData[1]}</option>`));
		}
		
		buildTable();
	} catch (error) {
		console.error(error.message);
	}
});

function buildTable(titleSearch, partnerId) {
	let table = $("#animetable");
	table.empty();
	
	let headerRow = $("<tr>");
	for (let col = 0; col < columns.length; col++) {
		let columnName = columns[col];
		if (Object.keys(displayRows).includes(columnName)) {
			headerRow.append($(`<th style='width: ${displayRows[columnName].width}'>${displayRows[columnName].displayName}</th>`));
		}
	}
	table.append(headerRow);
	
	let titleIndex = columns.findIndex((col) => col === "Title");
	let activePartnersIndex = columns.findIndex((col) => col === "WatchPartnersActive");
	
	let isEven = true;
	for (let row = 0; row < data.length; row++) {
		let activePartners = data[row][activePartnersIndex]?.split(",");
		if ((!titleSearch || data[row][titleIndex].toLowerCase().includes(titleSearch)) &&
			(!partnerId || activePartners?.includes(partnerId))) {
			let parity = isEven ? "even" : "odd"
			isEven = !isEven;
			let rowElem = $(`<tr class='${parity}'>`);
			for (let col = 0; col < data[row].length; col++) {
				let columnName = columns[col];
				if (Object.keys(displayRows).includes(columnName)) {
					let cellData = data[row][col];
					if (columnName === "Notes" && cellData.length >= 50) {
						cellData = cellData.substring(0, 50) + "...";
					}
					else if (columnName === "Title") {
						cellData = `<a href="/neweditanime.html?animeid=${data[row][0]}">${cellData}</a>`
					}
					if (cellData === null) cellData = "";
					rowElem.append($(`<td>${cellData}</td>`));
				}
			}
			table.append(rowElem);
		}
	}
}

function textSearch() {
	buildTable($("#titleSearch").val().toLowerCase(), $("#partnerSearch").val());
}

async function navigateToRandomAnime() {
	const response = await fetch(`${baseURL}/randomanime`);
	if (!response.ok) {
	  throw new Error(`Response status: ${response.status}`);
	}
	
	const result = await response.json();
	window.location.href = `/neweditanime.html?animeid=${result["message"]}`
}

async function downloadBackup() {
	window.location.href = `${baseURL}/backup`;
}