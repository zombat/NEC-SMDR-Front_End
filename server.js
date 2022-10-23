//debugger;
require(`dotenv`).config();
const	express = require(`express`),
		session  = require(`express-session`),
		mongo = require(`mongodb`).MongoClient,
		mongoose = require(`mongoose`),
		expressMongoDBStore = require(`connect-mongodb-session`)(session),
		ensureLoggedIn = require(`connect-ensure-login`).ensureLoggedIn(),
		request = require(`request`),
		bodyParser = require(`body-parser`),
		helperFunctions = require(`./helper-functions`),
		passport = require(`passport`),
		LocalStrategy = require(`passport-local`).Strategy,
		passportLocalMongoose = require(`passport-local-mongoose`),
		Account = require(`./models/account`),
		assert = require(`assert`),
		Schema = mongoose.Schema,
		secret = process.env.SESSION_SECRET,
		app = express(),
		https = require(`https`),
		mongoClient = require(`./mongoClient`),	
		fs = require(`fs`);	
		// Routes
		sysAdminRoute = require(`./routes/system-administration`),
		smdrAPIRoute = require(`./routes/smdr-api`),
		baseSiteRoute = require(`./base-site`),
		{ body } = require('express-validator');


if(process.env.MONGO_USER && process.env.MONGO_PASSWORD ){
	var mongoURL = process.env.MONGO_URL.replace(/\<username\>/,process.env.MONGO_USER);
	mongoURL = mongoURL.replace(/\<password\>/,process.env.MONGO_PASSWORD);
} else {
	var mongoURL = process.env.MONGO_URL;
}
mongoose.connect(mongoURL, { useUnifiedTopology: true, useNewUrlParser: true, dbName: process.env.MONGO_AUTH_DATABASE});


var store = new expressMongoDBStore({
			uri: mongoURL,
			databaseName: process.env.MONGO_AUTH_DATABASE,
			collection: `Sessions`
		});


passport.use(new LocalStrategy((username, password, done) => {
      UserDetails.findOne({
        username: username.toLowerCase()
      }, (err, user) => {
        if (err) {
          return done(err);
        }

        if (!user) {
          return done(null, false);
        }

        if (user.password != password) {
          return done(null, false);
        }
        return done(null, user);
      });
  }
));

app.use(`/public`, express.static(process.cwd() + `/public`));
app.use(express.json());
app.use(bodyParser.json( { limit: '125mb' }));
app.use(bodyParser.urlencoded({extended: true})); 
app.set(`views`, __dirname + `/views`);
app.set(`view engine`, `ejs`);
app.use(require(`morgan`)(`combined`));
app.use(require(`cookie-parser`)());
app.use(require(`body-parser`).urlencoded({ extended: true }));
if(process.env.SECURE_SERVER == true){
	app.use(require(`express-session`)({ secret: secret, resave: true, rolling: true, saveUninitialized: false, cookie: { _expires: 900000, secure: true, httpOnly: true }, store: store}));
} else {
	app.use(require(`express-session`)({ secret: secret, resave: true, saveUninitialized: true, store: store, cookie: { _expires: 900000, httpOnly: true }}));
}

app.use(passport.initialize());
app.use(passport.session());
app.use(`/smdr`, helperFunctions.logAccess, ensureLoggedIn, smdrAPIRoute);
app.use(`/system-administration`, helperFunctions.logAccess, ensureLoggedIn, sysAdminRoute);
app.use(`/`, baseSiteRoute);
 
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());



app.post(`/login`, body('username').isEmail().normalizeEmail(), helperFunctions.logAccess, passport.authenticate(`local`, { 
	successReturnToOrRedirect: `/`,	  
	failureRedirect: `/login`
	}), (req, res) => {
		res.redirect(`/`);
	});
	

if(process.argv[2] == `--initAdminUser`){
	Account.register(new Account({ 'username': process.argv[3].toLowerCase() }), process.argv[4], function(err, firstResponse) {
		if (err) {
			return err;
		}
		mongoClient.get().db(process.env.MONGO_AUTH_DATABASE).collection(`accounts`).updateOne( { '_id': firstResponse[`_id`] }, { $set: { 'firstname': `Created with flag`, 'lastname': `--initAdminUser`, 'phonenumber': ``, 'address': ``, 'company': `` } }, { upsert: true}, function(err, response){
			assert.equal(null, err);
			var permissionDocument = {
				_id: firstResponse[`_id`],
				sysadmin: true
			};
			mongoClient.get().db(process.env.MONGO_AUTH_DATABASE).collection(`permissions`).insertOne( permissionDocument, function(err, document) {
				if(err){
					console.log(err);
				}
				assert.equal(null, err);
			});
		});
	});
}


if(process.env.SECURE_SERVER == true){
	mongoClient.connect(() => {
		https.createServer({
		  key: fs.readFileSync(`./` + process.env.KEY_FILE_NAME),
		  cert: fs.readFileSync(`./` + process.env.CERT_FILE_NAME)
		}, app)

		.listen(process.env.SECURE_SERVER_PORT, () => {
		  helperFunctions.logFile(`HTTPS listening on port ` + process.env.SECURE_SERVER_PORT)
		});
	});
} else {
	mongoClient.connect(() => {
		app.listen(process.env.UNSECURE_SERVER_PORT, function (){
			console.log(`HTTP listening on port ` + process.env.UNSECURE_SERVER_PORT);
		});
	});
}
