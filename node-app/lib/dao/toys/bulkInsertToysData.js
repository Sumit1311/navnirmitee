var fs = require('fs');
var uuid = require('node-uuid');
const exec = require('child_process').execSync;


function ConvertToArray() {
    var data = fs.readFileSync(process.cwd() + '/nav_toys.remaining.csv');
    var rows = data.toString().trim().split(/#/);
    var queries = {
        "nav_toys" : [],
        "nav_toys_skills" : []
    }
    var queryPrefixToys = "INSERT INTO nav_toys (_id,", queryPrefixSkills="INSERT INTO nav_toys_skills (_id,toys_id,";
    //console.log(rows[0]);
    var columns = rows[0].trim().split(';');
    for(var j = 0; j < columns.length - 1; j++) {
        queryPrefixToys += columns[j];
        if(j == columns.length - 2) {
            queryPrefixToys += ") VALUES("
        } else {
            queryPrefixToys += ","
        }
    }
    //console.log(queryPrefixToys);
    var skillsColumn = columns[columns.length - 1];
    queryPrefixSkills += skillsColumn + ") VALUES(";
    var queryToys, querySkills;
    //console.log(queryPrefixSkills);
    for(var i = 1; i< rows.length; i++) {
        columns = rows[i].trim().split(';');
        var cells;
        queryToys = queryPrefixToys;
        var toys_id = uuid.v4();
        queryToys += "'" + toys_id + "',";

        for(j = 0; j < columns.length - 1; j++) {
            cells = columns[j].trim();
            if(j === 0) {
                for(var x = 1; x <= 5;x++) {
                   try {
                       fs.statSync("../public/img/toys/"+ columns[j] +"_"+ x +".jpg");
                   } catch(error) {
                        break;
                   }
                   exec("mv \"../public/img/toys/"+ columns[j] +"_"+ x +".jpg\" ../public/img/toys/"+toys_id+"_"+ x +".jpg");
                }
                //exec("mv \"../public/img/toys/"+ columns[j] +"_1.jpg\" ../public/img/toys/"+toys_id+"_1.jpg");
                //cells = cells.replace("'", "\\\'");
            }
            //console.log(cells);
            if(j === 0 || j === 4 || j === 5) {
                cells = cells.replace(new RegExp("'", 'g'), "''");
                queryToys += "'" + cells + "'";
            } else {
                queryToys += cells;

            }
            if(j == columns.length - 2){
                queryToys+=");";
            } else {
                queryToys += ",";
            }
        }
        console.log(queryToys);
        queries.nav_toys.push(queryToys);
        var skills = columns[j].split('::');
        var skills_id;
        for(j = 0; j < skills.length; j++) {
            skills_id = uuid.v4();
            querySkills = queryPrefixSkills +"'" + skills_id + "'"+ "," +"'" + toys_id + "',";
            cells = skills[j];
            querySkills += cells + ");";
            console.log(querySkills);
            queries.nav_toys_skills.push(querySkills);
        }

    }
    return queries; 
}

/*function CreateImages(rows) {
    for(var i =0; i < 1; i++) {
        exec("cp ../public/img/toys/T1_1.jpg ../public/img/toys/"+rows[i].name+"_1.jpg");
        exec("mv ../public/img/toys/"+rows[i].name +"_1.jpg ../public/img/toys/"+rows[i]._id+"_1.jpg");
    }
}*/

ConvertToArray();
//console.log(query.nav_toys[0]);
//console.log(query.nav_toys_skills.length);
//CreateImages(query.nav_toys);


