#!/usr/bin/php
<?php
 include_once ("/etc/freepbx.conf");
 global $db;

 exec('perl -e \'use NethServer::Directory; my $password = NethServer::Directory::getUserPassword("PhonebookDBPasswd", 0) ; printf $password;\'',$out2);
 $duser2 = 'pbookuser';
 $dpass2 = $out2[0];
 $dhost2 = 'localhost';

 $pbookdb = mysql_connect($dhost2, $duser2, $dpass2);
 mysql_select_db('phonebook', $local_db );

 $ext = $db->getAll('SELECT extension,name FROM users',DB_FETCHMODE_ASSOC);
 if (DB::IsError($db)){
     echo "Error reading extensions\n";
     exit (1);
 } 
 
 if (empty($ext)) exit (0);

 $query = "INSERT INTO phonebook.phonebook (owner_id,type, homeemail, workemail, homephone, workphone, cellphone,
                                                fax, title, company, notes, name, homestreet, homepob, homecity,
                                                homeprovince, homepostalcode, homecountry, workstreet, workpob,
                                                workcity, workprovince, workpostalcode, workcountry, url) VALUES ";

 foreach ($ext as $e){
     $values[] .= "('admin', 'extension', '', '', '','".mysql_escape_string($e['extension'])."', '', '', '', '','', '".mysql_escape_string($e['name'])."','', '', '','', '', '', '','', '', '', '','', '')";
 }
 
 $query .= implode(',',$values);
 
 if(!mysql_query($query,$pbookdb)) echo mysql_error()."\n";
