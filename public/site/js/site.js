/*
	Ray's NEC Toolkit - Site-wide Functions.js
	
	© 2020  Raymond Andrew Rizzo
	This software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement.IP
	In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.
*/

var workingDocumentID;

$(document).ready(function() {
	
	$(`body`).tooltip({ selector: `[data-toggle=tooltip]` });	
	
	
	$(`.nav-bar-item`).hover(function() {
		$(`#nav-text`).html($(this).attr(`title`));
	}, function() {
		$(`#nav-text`).text(``);
	});
	
	$(`.help-icon`).on(`click`, function(){
		$(`#help-overlay`).toggleClass(`d-none`);
	});
	
});

function blinkResult(classType){
	$(`#main-column`).addClass(`bg-` + classType);
	$(`#main-column`).removeClass(`bg-white`);
	setTimeout(function(){ 
		$(`#main-column`).addClass(`bg-white`);
		$(`#main-column`).removeClass(`bg-` + classType);
	}, 250);
}

function addHTMLOption(addTarget, optionValue, textValue, cssClass, functionName){		
	$(`#` + addTarget).append(`<option class="` + cssClass + `" value="` + optionValue + `" >` + textValue + `</option>`);
}

