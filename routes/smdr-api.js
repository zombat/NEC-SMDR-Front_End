const	path = require(`path`)
		require(`dotenv`).config({ path: path.resolve(__dirname, `../.env`) });
		url = process.env.SITE_URL;
const	helperFunctions = require(`../helper-functions`),
		assert = require(`assert`),
		express = require(`express`),
		router = express.Router(),
		ensureLoggedIn = require(`connect-ensure-login`).ensureLoggedIn(),
		mongoClient = require(`../mongoClient`),
		Account = require(`../models/account`),
		noPermissions = {
			'sysadmin': false,
			'smdrTool': false
		};
		
router.get(`/js/:id`, (req, res) => {
	if(req.hasOwnProperty(`user`)){
		let userID = req.user[`_id`] || 0;
		helperFunctions.getUserPermissions(userID, function(response){
			if(response!=null){
				// This permission cannot currently be assigned... Oops
				// if(response.smdrTool){
				if(true == true){
					res.sendFile( `/private/smdr-tool/js/` + req.params.id, { root: `./` });	
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

router.get(`/`, function(req, res){
	if(req.hasOwnProperty(`user`)){
		let userID = req.user[`_id`] || 0;
		helperFunctions.getUserPermissions(userID, function(response){
			if(response!=null){
				if(1 == 1){
					if(req.query.id){
						mongoClient.get().db(process.env.MONGO_SMDR_DATABASE).collection(process.env.MONGO_SMDR_COLLECTION).findOne( { '_id' : req.query.id }, (err, smdrDocument) => {
							assert.equal(null, err);
							res.render(`smdr-info`, { user: userID, userPermissions: response, smdrDocument: smdrDocument });
							});	
					} else {
						var query = {
							'$or' : []
						};
						var skip = parseInt(req.query.skip) || 0;
						var limit = parseInt(req.query.limit) || 20;
						if(skip < 0){
							skip = 0;
						}
						if(limit < 0){
							limit = 20;
						}
						var searchString = req.query.search || `getAllSmdr`;
						if(req.query.hasOwnProperty(`from`) && req.query.hasOwnProperty(`to`)){
							query = {
								'$and' : [
									{ '$or' : [ { 'CallingStationNumber.CallingPartyNumber' : req.query[`from`] }, { 'CallingPartyInformation.TelephoneNumber.CallingNumber' : req.query[`from`] }, { 'CallingPartyInformation.PhysicalNumber.CallingNumber' : req.query[`from`] }  ] },
									{ '$or' : [ { 'CalledPartyInformation.TelephoneNumber.CalledNumber' : req.query.to }, { 'CalledPartyInformation.PhysicalNumber.CalledNumber' : req.query.to }, { 'DialCode.DialCode' : req.query.to } ] },
								] };
						} else if(req.query.hasOwnProperty(`toOrFrom`)){
							if(req.query.toOrFrom.match(/-/)){
								var startRange = req.query.toOrFrom.split(`-`)[0];
								var endRange = req.query.toOrFrom.split(`-`)[1];
								query['$or'].push({ '$and' : [ { 'CallingStationNumber.CallingPartyNumber' : { '$gte' : startRange } }, { 'CallingStationNumber.CallingPartyNumber' : { '$lte' : endRange } } ] }); 
								query['$or'].push({ '$and' : [ { 'CallingPartyInformation.TelephoneNumber.CallingNumber' : { '$gte' : startRange } }, { 'CallingPartyInformation.TelephoneNumber.CallingNumber' : { '$lte' : endRange } } ] }); 
								query['$or'].push({ '$and' : [ { 'CallingPartyInformation.PhysicalNumber.CallingNumber' : { '$gte' : startRange } }, { 'CallingPartyInformation.PhysicalNumber.CallingNumber' : { '$lte' : endRange } } ] }); 
								query['$or'].push({ '$and' : [ { 'CalledPartyInformation.TelephoneNumber.CalledNumber' : { '$gte' : startRange } }, { 'CalledPartyInformation.TelephoneNumber.CalledNumber' : { '$lte' : endRange } } ] }); 
								query['$or'].push({ '$and' : [ { 'CalledPartyInformation.PhysicalNumber.CalledNumber' : { '$gte' : startRange } }, { 'CalledPartyInformation.PhysicalNumber.CalledNumber' : { '$lte' : endRange } } ] }); 
								query['$or'].push({ '$and' : [ { 'DialCode.DialCode' : { '$gte' : startRange } }, { 'DialCode.DialCode' : { '$lte' : endRange } } ] }); 
							} else {
								query['$or'].push({ 'CallingStationNumber.CallingPartyNumber' : req.query.toOrFrom });
								query['$or'].push({ 'CallingPartyInformation.TelephoneNumber.CallingNumber' : req.query.toOrFrom });
								query['$or'].push({ 'CallingPartyInformation.PhysicalNumber.CallingNumber' : req.query.toOrFrom });
								query['$or'].push({ 'CalledPartyInformation.TelephoneNumber.CalledNumber' : req.query.toOrFrom });
								query['$or'].push({ 'CalledPartyInformation.PhysicalNumber.CalledNumber' : req.query.toOrFrom });
								query['$or'].push({ 'DialCode.DialCode' : req.query.toOrFrom });
							}
						} else if(req.query.hasOwnProperty(`from`)){
							if(req.query[`from`].match(/-/)){
								var startRange = req.query[`from`].split(`-`)[0];
								var endRange = req.query[`from`].split(`-`)[1];
								query['$or'].push({ '$and' : [ { 'CallingStationNumber.CallingPartyNumber' : { '$gte' : startRange } }, { 'CallingStationNumber.CallingPartyNumber' : { '$lte' : endRange } } ] }); 
								query['$or'].push({ '$and' : [ { 'CallingPartyInformation.TelephoneNumber.CallingNumber' : { '$gte' : startRange } }, { 'CallingPartyInformation.TelephoneNumber.CallingNumber' : { '$lte' : endRange } } ] });  
								query['$or'].push({ '$and' : [ { 'CallingPartyInformation.PhysicalNumber.CallingNumber' : { '$gte' : startRange } }, { 'CallingPartyInformation.PhysicalNumber.CallingNumber' : { '$lte' : endRange } } ] });
							} else {
								query['$or'].push({ 'CallingStationNumber.CallingPartyNumber' : req.query[`from`] }); 
								query['$or'].push({ 'CallingPartyInformation.TelephoneNumber.CallingNumber' : req.query[`from`] });  
								query['$or'].push({ 'CallingPartyInformation.PhysicalNumber.CallingNumber' : req.query[`from`] });
							}							
						} else if(req.query.hasOwnProperty(`to`)){
							if(req.query.to.match(/-/)){
								var startRange = req.query.to.split(`-`)[0];
								var endRange = req.query.to.split(`-`)[1];
								query['$or'].push({ '$and' : [ { 'CalledPartyInformation.TelephoneNumber.CalledNumber' : { '$gte' : startRange } }, { 'CalledPartyInformation.TelephoneNumber.CalledNumber' : { '$lte' : endRange } } ] }); 
								query['$or'].push({ '$and' : [ { 'CalledPartyInformation.PhysicalNumber.CalledNumber' : { '$gte' : startRange } }, { 'CalledPartyInformation.PhysicalNumber.CalledNumber' : { '$lte' : endRange } } ] });  
								query['$or'].push({ '$and' : [ { 'DialCode.DialCode' : { '$gte' : startRange } }, { 'DialCode.DialCode' : { '$lte' : endRange } } ] });
							} else {
								query['$or'].push({ 'CalledPartyInformation.TelephoneNumber.CalledNumber' : req.query.to });
								query['$or'].push({ 'CalledPartyInformation.PhysicalNumber.CalledNumber' : req.query.to });
								query['$or'].push({ 'DialCode.DialCode' : req.query.to });
							}
						} else if(req.query.hasOwnProperty(`fromDate`) || req.query.hasOwnProperty(`toDate`)){
							query = { '$and' : [ ] };
							if(req.query.hasOwnProperty(`fromDate`)){
								query['$and'].push( { 'CallTime.Start.TimeStamp' : { '$gte' : new Date(req.query.fromDate + `T00:00:00Z`) } } );
							}
							if(req.query.hasOwnProperty(`toDate`)){
								query['$and'].push( { 'CallTime.End.TimeStamp' : { '$lte' : new Date(req.query.toDate + `T23:59:59Z`) } } );
							}
							console.log(query);
						} else {
							query = {};		
						}
						if(req.query.sortField == `RecordType`){
							var sorting = { 'RecordType' : parseInt(req.query.sort)};
						} else if(req.query.sortField == `From`) {
							var sorting = {
								'CallingStationNumber.CallingPartyNumber' : parseInt(req.query.sort),
								'CallingPartyInformation.TelephoneNumber.CallingNumber' : parseInt(req.query.sort),
								'CallingPartyInformation.PhysicalNumber.CallingNumber' : parseInt(req.query.sort)
							};
						} else if(req.query.sortField == `To`) {
							var sorting = {
								'CalledPartyInformation.TelephoneNumber.CalledNumber' : parseInt(req.query.sort),
								'CalledPartyInformation.PhysicalNumber.CalledNumber' : parseInt(req.query.sort),
								'DialCode.DialCode' : parseInt(req.query.sort)
							};
						} else if(req.query.sortField == `Route`) {
							var sorting = {
								'OutgoingTrunk.PhysicalOutgoingRouteNumber' : parseInt(req.query.sort),
								'OutgoingTrunk.LogicalOutgoingRouteNumber' : parseInt(req.query.sort),
								'IncomingTrunk.PhysicalOutgoingRouteNumber' : parseInt(req.query.sort),
								'IncomingTrunk.LogicalOutgoingRouteNumber' : parseInt(req.query.sort)
							};
						} else if(req.query.sortField == `Trunk`) {
							var sorting = {
								'OutgoingTrunk.TrunkNumber' : parseInt(req.query.sort),
								'IncomingTrunk.TrunkNumber' : parseInt(req.query.sort)
							};
						} else if(req.query.sortField == `StartTime`) {
							var sorting = {
								'CallTime.Start.TimeStamp' : parseInt(req.query.sort)
							};
						} else if(req.query.sortField == `EndTime`) {
							var sorting = {
								'CallTime.End.TimeStamp' : parseInt(req.query.sort)
							};
						} else {
							var sorting = { '_id' : 1};
						}
						console.log(sorting);
						mongoClient.get().db(process.env.MONGO_SMDR_DATABASE).collection(process.env.MONGO_SMDR_COLLECTION).countDocuments(query, (err, documentCount) => {
							mongoClient.get().db(process.env.MONGO_SMDR_DATABASE).collection(process.env.MONGO_SMDR_COLLECTION).find(query).sort(sorting).limit(limit).skip(skip).toArray(function(err, smdrDocuments) {
								assert.equal(null, err);
								var pageCount = Math.ceil(documentCount/limit);
								if(skip > 0){
									var currentPage = Math.trunc(skip/limit+1);
								} else {
									var currentPage = 1;
								}
								res.render(`smdr-tool`, { user: userID, userPermissions: response, sortField: req.query.sortField || false, sort: req.query.sort || false, smdrDocuments: smdrDocuments, pageCount: pageCount, currentPage: currentPage, recordCount: documentCount, skip: skip, limit: limit, searchFrom: req.query['from'], searchTo: req.query.to, toOrFrom: req.query.toOrFrom, fromDate: req.query.fromDate || false, toDate: req.query.toDate || false });
							});
						});
					}
					
				} else {
					res.render(`home`, { user: req.user, userPermissions: noPermissions });
				}					
			} else {
				res.render(`home`, { user: req.user, userPermissions: noPermissions });
			}
		});
	} else {
		res.render(`home`, { user: req.user, userPermissions: noPermissions });
	}
});

module.exports = router;
