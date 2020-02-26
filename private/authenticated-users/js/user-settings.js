/*
	Ray's NEC Toolkit - User Setting Functions.js
	
	© 2020 - Raymond Andrew Rizzo

	This software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement.IP
	In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.
*/

var timeOut = 5000;
var newPasswordGood = true;
$( document ).ready(function() {
	
	$(`#user-settings-change-password-button`).on(`click`, function(){
		if($(`#user-settings-new-password`).val() == $(`#user-settings-verify-password`).val() && newPasswordGood){
			var data = {
				'oldPassword' : $(`#user-settings-user-password`).val(), 
				'newPassword' : $(`#user-settings-new-password`).val()
			};
			getSetUserInfo(`set-password`, data, function(response){
				$(`#wait-overlay`).addClass(`d-none`);
				if(response.success){
					alert(response.data.message);
				} else {
					alert(`Old password must mactch existing password`);
				}
				
			});
		} else {
			alert(`"New Password" and "Verify Password" fields must mactch.`);
		}
	});
	
	$(`#user-settings-new-password`).on(`keyup`, function(){
		if($(`#user-settings-new-password`).val().length < 12 && $(`#user-settings-new-password`).val().match(/^(?:[0-9A-Za-z]+|([._%+-])(?!\1))+$/)){
			if(!$(`#user-settings-new-password`).hasClass(`bg-danger`)){
				$(`#user-settings-new-password`).addClass(`bg-danger text-white`);
				$(`#user-settings-new-password`).removeClass(`bg-success`);
				newPasswordGood = true;
			}
		} else {
			if($(`#user-settings-new-password`).hasClass(`bg-danger`) && $(`#user-settings-new-password`).hasClass(`text-white`)){
				$(`#user-settings-new-password`).removeClass(`bg-danger`);
				$(`#user-settings-new-password`).addClass(`bg-success`);
				newPasswordGood = true;
			}
		}
	});
	
	$(`#user-settings-verify-password`).on(`keyup`, function(){
		if($(`#user-settings-new-password`).val() == $(`#user-settings-verify-password`).val() && newPasswordGood){
			$(`#user-settings-verify-password`).addClass(`bg-success`);
			$(`#user-settings-verify-password`).removeClass(`bg-danger`);
		} else {
			$(`#user-settings-verify-password`).removeClass(`bg-success`);
			$(`#user-settings-verify-password`).removeClass(`bg-danger`);
			$(`#user-settings-verify-password`).addClass(`bg-danger text-white`);
		}
	});
	
	getSetUserInfo(`get`, null, function(response){
		if(response.success){
			$(`#wait-overlay`).addClass(`d-none`);
			$(`#app-user-first-name`).val(response.data.firstname);
			$(`#app-user-last-name`).val(response.data.lastname);
			$(`#app-user-email`).val(response.data.username);
			$(`#app-user-phone`).val(response.data.phonenumber);
			$(`#app-user-company`).val(response.data.company);
			$(`#app-user-address`).val(response.data.address);
		}
	});
});

function getSetUserInfo(getOrSet, data, callback){
	$(`#wait-overlay`).removeClass(`d-none`);
	$.ajax({
		type: `POST`,
		url: `/user-settings/api`,
		data: JSON.stringify({ 'getOrSet': getOrSet, 'data': data}),
		contentType: `application/json; charset=utf-8`,
		dataType: `json`,
		success: function(data){
			callback({ 'success': true, 'data': data});
		},
		failure: function(err) {
			callback({ 'success': false, 'message': err});
		},
		error: function(jqXHR, exception ){
			location.reload();
		},
		timeout: timeOut
	});
}
