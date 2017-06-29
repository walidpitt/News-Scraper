
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");


var Note = require("./models/Note.js");
var Article = require("./models/Article.js");


var request = require("request");
var cheerio = require("cheerio");


var Promise = require("bluebird");

mongoose.Promise = Promise;


var app = express();


app.use(logger("dev"));
app.use(bodyParser.urlencoded({
    extended: false
}))


app.use(express.static("public"));


var databaseUri = "mongodb://localhost/News-Scraper";

if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI);
} else {
    mongoose.connect(databaseUri);
}

var db = mongoose.connection;


db.on("error", function(error) {
    console.log("Mongoose Error: ", error);
});


db.once("open", function() {
    console.log("Mongoose connection successful.");
});



app.get("/", function(req, res) {
    res.send(index.html)
});


app.get("/scrape", function(req, res) {
    
    request("https://www.espn.com/section/local/", function(error, response, html) {
        
        var $ = cheerio.load(html);
        $("div .info").each(function(i, element) {

          
            var result = {};
            
            result.title = $(this).find("h2").text().trim();
            result.image = $(this).find("figure").find("img").attr("src");
            result.link = $(this).find("a").attr("href");

            console.log(result);

            
            var entry = new Article(result);

            
            entry.save(function(err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(doc);
                }
            });
        });
    });
    res.send("Scrape Complete");
});


app.get("/articles", function(req, res) {
    
    Article.find({}, function(error, doc) {
        if (error) {
            console.log(error);
        } else {
            
            res.json(doc);
        }
    });
});


app.get("/articles/:id", function(req, res) {
    
    Article.findOne({ "_id": req.params.id })
        
        .populate("note")
        
        .exec(function(error, doc) {
            if (error) {
                console.log(error)
            }
            
            else {
                res.json(doc);
            }
        });
});



app.post("/articles/:id", function(req, res) {
    
    var newNote = new Note(req.body);

    
    newNote.save(function(error, doc) {
        if (error) {
            console.log(error);
        } else {
            
            Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
                
                .exec(function(err, doc) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.send(doc);
                    }
                });
        }
    });
});



var PORT = process.env.PORT || 3000;
app.listen(PORT);
