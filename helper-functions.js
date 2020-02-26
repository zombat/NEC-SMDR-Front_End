const	mongoClient = require(`./mongoClient`),
		assert = require(`assert`),
		fs = require(`fs`);
		
module.exports = {
	padChar: (myString, myLength, padChar) => {
		while(myString.length < myLength){
			myString = padChar + myString ;
		}
		return(myString);
	},
	
	checkDBPermission: (userID, databaseName, callback) => {
		// Check for database permissions and return true or false
		mongoClient.get().db(process.env.MONGO_AUTH_DATABASE).collection(`permissions`).findOne({ '$and': [{ '_id' : require(`mongodb`).ObjectID(userID) }, { 'dbPermissions.dbName' : databaseName }] }, (err, response) => {
			if(err){
				logErrors(err);
			}
			assert.equal(null, err);
			if(response == null){
				callback(false);
			} else {
				callback(true)
			}
		});
	},
	
	lowercaseUsername: (req, res, next) => {
		req.body.username = req.body.username.toLowerCase().trim();
		next();
	},

	generatePassword: () => {
		const charArray = [`1`,`2`,`3`,`4`,`5`,`5`,`6`,`7`,`8`,`9`,`0`,`a`,`b`,`c`,`d`,`e`,`f`,`g`,`h`,`i`,`j`,`k`,`l`,`m`,`n`,`o`,`p`,`q`,`r`,`s`,`t`,`u`,`v`,`w`,`x`,`y`,`z`,`A`,`B`,`C`,`D`,`E`,`F`,`G`,`H`,`I`,`J`,`K`,`L`,`M`,`N`,`O`,`P`,`Q`,`R`,`S`,`T`,`U`,`V`,`W`,`X`,`Y`,`Z`,`~`,`!`,`@`,`#`,`$`,`%`,`^`,`&`,`*`,`(`,`)`,`-`,`=`,`_`,`+`,`?`,`|`];
		var newPassword =``;
		while(newPassword.length < 24){
			newPassword = newPassword + charArray[Math.floor(Math.random() * Math.floor(79))];
		}
		return(newPassword);
	},	

	logFile: (message) => {
		message = module.exports.theDate() + ` : ` + message + `\n`
		fs.appendFile(`./logs/` + module.exports.theDate(`date`) + `.log`, message, `utf8`, (err) => {
			console.log(message);	
		});
	},

	logAccess: (req, res, next) => {
		let reqIP = req.headers[`x-forwarded-for`] || req.connection.remoteAddress;
		
		if(req.user != undefined){
			var userID = require(`mongodb`).ObjectID(userID);
		} else {
			var userID = `logged-out-user`;
		}
		
		var message = JSON.stringify(req.headers) + `\n` + reqIP + `\n` + userID + `\n`;
		module.exports.logFile(message);
		next();
	},

	theDate: (requestType) => {
		var dateFnc = new Date();
		var date = dateFnc.getFullYear() + `-` + (dateFnc.getMonth() + 1) + `-` + dateFnc.getDate();
		var time = dateFnc.getHours() + `:` + dateFnc.getMinutes() + `:` + dateFnc.getSeconds();
		var dateTime = date + `-` + time;
		if(requestType == undefined || requestType == dateTime){
			return dateTime;
		} else if(requestType == `date`) {
			return date;
		}
		
		
	},
	
	getUserPermissions: (userID, callback) => {
		mongoClient.get().db(process.env.MONGO_AUTH_DATABASE).collection(`permissions`).findOne( {_id: require(`mongodb`).ObjectID(userID) }, (err, userDocument) => {
			assert.equal(null, err);
			callback(userDocument);
		});
	}
};