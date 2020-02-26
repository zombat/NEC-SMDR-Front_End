const	path = require(`path`);
		require(`dotenv`).config({ path: path.resolve(__dirname, `../.env`) });
const	url = process.env.SITE_URL,
		helperFunctions = require(`../helper-functions`),
		assert = require(`assert`),
		express = require(`express`),
		router = express.Router(),
		ensureLoggedIn = require(`connect-ensure-login`).ensureLoggedIn(),
		mongoClient = require(`../mongoClient`),
		Account = require(`../models/account`);

router.get(`/js/:id`, (req, res) => {
	if(req.hasOwnProperty(`user`)){
		let userID = req.user[`_id`] || 0;
		helperFunctions.getUserPermissions(userID, function(response){
			if(response!=null){
				if(response.sysadmin){
					res.sendFile( `/private/system-administration/js/` + req.params.id, { root: `./` });	
				} else {
					res.status(401);
					res.send(`Unauthorized`)
				} 
			} else {
				res.status(401);
				res.send(`Unauthorized`)
			}
		});
	} else {
		res.status(401);
		res.send(`Unauthorized`)
	}
});

router.get(`/`, (req, res) => {
		var requestIP = req.headers[`x-forwarded-for`] || req.connection.remoteAddress;
		if(req.hasOwnProperty(`user`)){
			let userID = req.user[`_id`] || 0;
			helperFunctions.getUserPermissions(userID, function(response){
				if(response!=null){
					if(response.sysadmin){
						res.render(`system-administration`, { user: userID, userPermissions: response });
					} else {
						logUnauthorizedAttempts(userID, requestIP, `/system-administration`, function(response){
							res.status(401);
							res.redirect(`/unauthorized-access`);
						});
					}
				} else {
					logUnauthorizedAttempts(userID, requestIP, `/system-administration`, function(response){
						res.status(401);
						res.redirect(`/unauthorized-access`);
					});
				}
			});		
		} else {	
			logUnauthorizedAttempts(`logged-out-user`, requestIP, `/system-administration`, function(response){
				res.status(401);
				res.redirect(`/login`);
			});
		}
	}),

router.post(`/api`, (req, res) => {
	var requestIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		if(req.hasOwnProperty(`user`)){
		let userID = req.user[`_id`] || 0;
		helperFunctions.getUserPermissions(userID, function(response){
			if(response!=null){
				if(response.sysadmin){
					if(req.body.requestType.match(/get-all-users/i)){
						mongoClient.get().db(process.env.MONGO_AUTH_DATABASE).collection(`accounts`).find({},{ 'projection' : { '_id' : 1, 'username': 1 }}).sort({ 'LastName': 1, 'FirstName': 1}).toArray(function(err, documents) {
								assert.equal(null, err);
								res.json(documents);
							});
					} else if(req.body.requestType.match(/save-user/i)){
						mongoClient.get().db(process.env.MONGO_AUTH_DATABASE).collection(`accounts`).updateOne( { '_id': require(`mongodb`).ObjectID(req.body.userID) }, { $set: { 'firstname': req.body.data.firstName, 'lastname': req.body.data.lastName, 'phonenumber': req.body.data.phoneNumber, 'address': req.body.data.address, 'company': req.body.data.companyName } }, function(err, response){
							assert.equal(null, err);
							mongoClient.get().db(process.env.MONGO_AUTH_DATABASE).collection(`permissions`).updateOne( { '_id': require(`mongodb`).ObjectID(req.body.userID) }, { $set: { 'sysadmin': req.body.data.systemAdministration } }, function(err, finalResponse){
								assert.equal(null, err);
								res.json(finalResponse);
							});
						}); 
					} else if(req.body.requestType.match(/delete-user/i)){
						mongoClient.get().db(process.env.MONGO_AUTH_DATABASE).collection(`accounts`).deleteOne( { '_id': require(`mongodb`).ObjectID(req.body.userID) }, function(err, response){
							assert.equal(null, err);
							mongoClient.get().db(process.env.MONGO_AUTH_DATABASE).collection(`permissions`).deleteOne( { '_id': require(`mongodb`).ObjectID(req.body.userID) }, function(err, finalResponse){
								assert.equal(null, err);
								res.json(finalResponse);
							});
						});
					} else if(req.body.requestType.match(/get-user-info/i)){
						mongoClient.get().db(process.env.MONGO_AUTH_DATABASE).collection(`accounts`).findOne({ '_id':  require(`mongodb`).ObjectID(req.body.userID) },{ 'projection' : { '_id' : 1, 'username': 1, 'firstname': 1, 'lastname': 1, 'phonenumber': 1, 'address': 1, 'company': 1 }}, function(err, document) {
								assert.equal(null, err);
								var finalDocument = document;
								mongoClient.get().db(process.env.MONGO_AUTH_DATABASE).collection(`permissions`).findOne({ '_id':  require(`mongodb`).ObjectID(req.body.userID) }, function(err, document) {
									assert.equal(null, err);
									if(document == null){
										finalDocument.sysAdmin = false;
										res.json(finalDocument);
									} else {
										finalDocument.sysAdmin = document.sysadmin;
										res.json(finalDocument);
									}
								});
							});
					} else if(req.body.requestType.match(/create-new-user/i)){
						var newPassword = helperFunctions.generatePassword();
						Account.register(new Account({ 'username': req.body.data.userName.toLowerCase() }), newPassword, function(err, firstResponse) {
							if (err) {
								return err;
							}
							mongoClient.get().db(process.env.MONGO_AUTH_DATABASE).collection(`accounts`).updateOne( { '_id': firstResponse[`_id`] }, { $set: { 'firstname': req.body.data.firstName, 'lastname': req.body.data.lastName, 'phonenumber': req.body.data.phoneNumber, 'address': req.body.data.address, 'company': req.body.data.companyName } }, function(err, response){
								assert.equal(null, err);
								var permissionDocument = {
									_id: firstResponse[`_id`],
									sysadmin: req.body.data.systemAdministration || false
								}
								mongoClient.get().db(process.env.MONGO_AUTH_DATABASE).collection(`permissions`).insertOne( permissionDocument, function(err, document) {
									assert.equal(null, err);
									res.json({ 'success': true, 'message': 'Password changed', 'userID': firstResponse[`_id`], 'password': newPassword});
								});
							});
						});
					} else if(req.body.requestType.match(/reset-password/i)){
						var newPassword = helperFunctions.generatePassword();
						Account.findOne({ '_id': require(`mongodb`).ObjectID(req.body.userID) },function (err, user){
							if (err) {
								res.json({ success: false, message: err });
							} else {
								if (!user) {
									res.status(401);
									res.json({ success: false, message: `User not found` });
								} else {
									user.setPassword(newPassword, function(err) {
										 if(err) {
												  if(err.name === `IncorrectPasswordError`){
													  res.status(401);
													  res.json({ success: false, message: 'Incorrect password' }); // Return error
												  }else {
													  res.status(500);
													  res.json({ success: false, message: 'This is embarrasing...' });
												  }
										} else {
											user.save();
											res.json({ 'success': true, 'message': 'Password changed', 'password': newPassword});
										}
									});
								}
							}
						}); 			
					}					
				} else {
					helperFunctions.logUnauthorizedAttempts(req.user[`_id`], requestIP, `/api/system-administration`, function(response){
						res.status(401);
						res.json({'error': 'Unauthorized Access'});
					});
				}
			} else {
				helperFunctions.logUnauthorizedAttempts(req.user[`_id`], requestIP, `/api/system-administration`, function(response){
					res.status(401);
					res.json({'error': 'Unauthorized Access'});
				});
			}
			});		
		} else {
			helperFunctions.logUnauthorizedAttempts(`logged-out-user`, requestIP, `/api/system-administration`, function(response){	
				res.status(401);
				res.json({'error': 'Unauthorized Access'});
			});
		}
	})

		
module.exports = router;