/*
	Ray's NEC Toolkit - SMDR Tool Functions
	
	© 2020 - Raymond Andrew Rizzo

	This software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement.IP
	In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.
*/

var timeOut = 5000;
var newPasswordGood = true;

var skip = 2500;
var limit = 20;

$(document).ready( () => {
	
	$(`#back-button`).on(`click`, () => { 
		window.history.back();
	});
	
	$(`#search-button`).on(`click`, () => {
		search();
	});
	
	$(`#search-string`).keyup((e) => {
		if(e.key == `Enter`){
			e.preventDefault();
			search();
		} 
	});
	
	$(`#search-select`).on(`change`, () => { 
		if($(`#search-select`).val() == `date`){
			$(`<input type="date" id="from-date" />`).insertBefore(`#search-string`);
			//$(`<label for="from-date" class="margin-10" id="from-date-label"><strong>From</strong></label>`).insertBefore(`#from-date`);
			$(`<input type="date" id="to-date" />`).insertBefore(`#search-string`);
			//$(`<label for="from-date" class="margin-10" id="to-date-label"><strong>To</strong></label>`).insertBefore(`#to-date`);
			$(`#search-string`).remove();
		} else {
			$(`<input type="text" class="form-control" id="search-string">`).insertBefore(`#from-date`);
			$(`#from-date`).remove();
			//$(`#from-date-label`).remove();
			$(`#to-date`).remove();
			//$(`#to-date-label`).remove();
		}
	}); 
	
});

function search(){
	if($(`#search-select`).val() == `date`){
			if($(`#from-date`).val().length && $(`#to-date`).val().length){
				window.location.href = `/smdr?fromDate=` + $(`#from-date`).val() + `&toDate=` + $(`#to-date`).val();
			} else if($(`#from-date`).val().length){
				window.location.href = `/smdr?fromDate=` + $(`#from-date`).val();
			} else if($(`#to-date`).val().length){
				window.location.href = `/smdr?toDate=` + $(`#to-date`).val();
			}
		} else {
			if(!$(`#search-string`).val().length){
				window.location.href = `/smdr`;
			} else {
				window.location.href = `/smdr?` + $(`#search-select`).val() + `=` + $(`#search-string`).val();
			}
		}
}