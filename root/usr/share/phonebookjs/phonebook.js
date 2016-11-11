//
// phonebook.js
// 
// This is a simple LDAP server which reads records from 
// phonebook MySQL database and return results in LDAP format.
//
// No LDAP bind is requires by clients.
//
// Usage:
//    node phonebook.js <config_file>
//
// The config file must be in JSON format

const util = require('util')
var ldap = require('ldapjs');
var mysql = require("mysql");
var addrbooks = [];
var config_file = "";
var config = {
  "debug" : false,
  "port" : 389,
  "db_host" : "localhost",
  "db_port" : "3306",
  "db_user" : "",
  "db_pass" : "",
  "db_name" : "",
  "basedn" : "dc=phonebook, dc=nh",
  "user": "nobody",
  "group": "nobody"
}

// load config file;
if (process.argv[2]) {
  config_file = process.argv[2];
}

if (config_file) {
  if ( !config_file.startsWith("/") ) {
      config_file = "./"+config_file;
  }
  config = require(config_file);
}
_debug("Loaded config: "+util.inspect(config));

var server = ldap.createServer();
var db = mysql.createConnection({
  host: config.db_host,
  port: config.db_port,
  user: config.db_user,
  password: config.db_pass,
  database: config.db_name
});



function _debug (msg) {
  if (config.debug) {
      console.log(msg);
  }
}

db.query("SELECT id,name,company,homephone,workphone,cellphone,fax FROM phonebook", function(err, contacts) {
  if (err) {
    console.log("Error fetching records", err);
    process.exit(1);
  }

  for (var i = 0; i < contacts.length; i++) {

    if (!contacts[i].workphone && !contacts[i].cellphone && contacts[i].homephone) {
        continue;
    }

    name = contacts[i].id;
    if ( contacts[i].name ) {
        name = contacts[i].name;
    } else {
        name = contacts[i].company;
    }
    // replace invalid chars in dn
    name = name.replace('+', ' ');

    addrbooks.push({
      dn: "cn=" + contacts[i].name + ", " + config.basedn,
      attributes: {
        objectclass: [ "top" ],
        telephoneNumber: contacts[i].workphone,
        mobile: contacts[i].cellphone,
        homePhone: contacts[i].homephone,
        cn: contacts[i].name,
        givenName: contacts[i].name,
        ou: contacts[i].company
      }
    });
  }

  server.bind(config.basedn, function (req, res, next) {
    // Only anonymous bind
    res.end();
    return next();
  });

  server.search(config.basedn, function(req, res, next) {
    _debug("Query from " + req.connection.remoteAddress + ":" + req.filter);
    for (var i = 0; i < addrbooks.length; i++) {
      if (req.filter.matches(addrbooks[i].attributes))
        res.send(addrbooks[i]);
    }
    res.end();
  });

  server.listen(config.port, function() {
    console.log("phonebook.js started at " + server.url);
    process.setgid(config.group);
    process.setuid(config.user);
  });
});
