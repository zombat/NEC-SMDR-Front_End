$(document).ready(function() {
	$(`#system-administration-insert-user`).on(`click`, function(){
		if(!$(`#system-adminsitration-user-list`).val() && $(`#system-adminsitration-user-email`).val()){
			if(confirm(`Are you sure you want create the new user: ` + $(`#system-adminsitration-user-email`).val() + `?`)){
				var userObject = {
					'userName': $(`#system-adminsitration-user-email`).val(),
					'firstName': $(`#system-adminsitration-user-first-name`).val(),
					'lastName': $(`#system-adminsitration-user-last-name`).val(),
					'phoneNumber': $(`#system-adminsitration-user-phone`).val(),
					'address': $(`#system-adminsitration-user-address`).val(),
					'companyName': $(`#system-adminsitration-user-company`).val(),
					'systemAdministration': $(`#system-administration-system-administration`).is(`:checked`)
				};
				systemAdministration(`create-new-user`, null, userObject, function(result){
					refreshUserList();
					alert(`New user login: ` + $(`#system-adminsitration-user-email`).val() + `\nNew user password: ` + result.data.password);
					clearFields();
				});
			}
		}	
	});
	
		$(`#system-administration-delete-user`).on(`click`, function(){
		if($(`#system-adminsitration-user-list`).val() && $(`#system-adminsitration-user-email`).val()){
			if(confirm(`Are you sure you want delete user: ` + $(`#system-adminsitration-user-email`).val() + `?`)){
				systemAdministration(`delete-user`, $(`#system-adminsitration-user-list`).val(), null, function(result){
					refreshUserList();
					clearFields();
				});
			}
		}	
	});
	
	
	$(`#system-administration-save-user`).on(`click`, function(){
		if($(`#system-adminsitration-user-list`).val() && $(`#system-adminsitration-user-email`).val()){
			if(confirm(`Are you sure you want save the user: ` + $(`#system-adminsitration-user-email`).val() + `?`)){
				var userObject = {
					'userName': $(`#system-adminsitration-user-email`).val(),
					'firstName': $(`#system-adminsitration-user-first-name`).val(),
					'lastName': $(`#system-adminsitration-user-last-name`).val(),
					'phoneNumber': $(`#system-adminsitration-user-phone`).val(),
					'address': $(`#system-adminsitration-user-address`).val(),
					'companyName': $(`#system-adminsitration-user-company`).val(),
					'systemAdministration': $(`#system-administration-system-administration`).is(`:checked`)
				};
				systemAdministration(`save-user`, $(`#system-adminsitration-user-list`).val(), userObject, function(result){
					refreshUserList();
					clearFields();
				});
			}
		}	
	});
	
	$(`#system-administration-reset-password`).on(`click`, function(){
		if($(`#system-adminsitration-user-list`).val()){
			if(confirm(`Are you sure you want to reset the password for ` + $(`#system-adminsitration-user-email`).val() + `?`)){
				systemAdministration(`reset-password`, $(`#system-adminsitration-user-list`).val(), null, function(result){
					alert(`New user password: ` + result.data.password);
				});
			}
		}
	});
	
	$(`#system-administration-clear`).on(`click`, function(){
		clearFields();
	});
	
	$(`#system-adminsitration-user-list`).on(`change`, function(){
	/*
		Get user details when selected
	*/
		systemAdministration(`get-user-info`, $(`#system-adminsitration-user-list`).val(), null, function(result){
			$(`#system-adminsitration-user-first-name`).val(result.data.firstname);
			$(`#system-adminsitration-user-last-name`).val(result.data.lastname);
			$(`#system-adminsitration-user-phone`).val(result.data.phonenumber);
			$(`#system-adminsitration-user-address`).val(result.data.address);
			$(`#system-adminsitration-user-company`).val(result.data.company);
			$(`#system-adminsitration-user-email`).val(result.data.username);
			$(`#system-administration-system-administration`).prop(`checked`, result.data.sysAdmin);
		});
	});
	
	
	
	refreshUserList();
});

function clearFields(){
	$(`#system-adminsitration-user-list`).val(``);
	$(`#system-adminsitration-user-first-name`).val(``);
	$(`#system-adminsitration-user-last-name`).val(``);
	$(`#system-adminsitration-user-phone`).val(``);
	$(`#system-adminsitration-user-address`).val(``);
	$(`#system-adminsitration-user-company`).val(``);
	$(`#system-adminsitration-user-email`).val(``);
	$(`#system-administration-system-administration`).prop(`checked`, false);
}


function refreshUserList(){
	$(`#system-adminsitration-user-list`).empty();
	systemAdministration(`get-all-users`, null, null, function(result){
		if(result.success){
			result.data.forEach(function(userEntry){
				addHTMLOption(`system-adminsitration-user-list`, userEntry[`_id`], userEntry.username, `user-entry`);
			});
		}
	});
}

function systemAdministration(requestType, userID, data, callback){
	var dataObject = { 'userID': userID, 'requestType': requestType, 'data': data };
	$.ajax({
		type: `POST`,
		url: `/system-administration/api`,
		data: JSON.stringify(dataObject),
		contentType: `application/json; charset=utf-8`,
		dataType: `json`,
		success: function(data){
			callback({ 'success': true, 'data': data });
			$(`#wait-overlay`).addClass(`hidden`);
		},
		failure: function(err) {
			callback({ 'success': false, 'error': err });
			$(`#wait-overlay`).addClass(`hidden`);
		},
		error: function(jqXHR, exception ){
			location.reload();
		},
		timeout: 5000
	});
}

function addHTMLOption(addTarget, optionValue, textValue, cssClass, functionName){		
	$(`#` + addTarget).append(`<option class="` + cssClass + `" value="` + optionValue + `" >` + textValue + `</option>`);
}