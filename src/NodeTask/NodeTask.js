const fs = require('fs');
const path = require('path');
const http = require('http');
const EventEmitter = require('events');

const server = http.createServer();

const handleEmitter = new EventEmitter();
const FilePathdirectory = path.join(__dirname, 'fetchApiData.json')


handleEmitter.on('GET/articleall', (req, res) => {

    fs.readFile(FilePathdirectory, 'utf8', (err, data) => { // to read files
        if (err) {
            if (err.code === 'ENOENT') {
                fs.writeFile(FilePathdirectory, JSON.stringify({ //if file doesnot exist then cretae a new one file 
                    articles: []
                }), (err) => {
                    if (err) {                        
                        res.statusCode = 500;
                        return res.end(JSON.stringify(err));
                    } else {
                        res.write(JSON.stringify([]))
                        return res.end()
                    }
                })
            }
            else {
                res.statusCode = 500;
                return res.end(err);
            }
        }
        res.write(data);
        return res.end();

    })

})

//to add article data to database
handleEmitter.on('Post/articlepostdata', (req, res) => {

       const postadata = fs.readFileSync(FilePathdirectory, 'utf8');
    console.log(postadata)
    const data12 = JSON.parse(postadata);
    let bodyreqdata = {}
    req.on("data", (bodyData) => {
        const data = JSON.parse(bodyData.toString())
        data.id = data12.length + 1;
        bodyreqdata = data       
    })

    req.on('end', () => {
        data12.push(bodyreqdata);

        fs.writeFile(FilePathdirectory, JSON.stringify(data12), (err) => {
            if (err) {
                console.log(err)
                res.statusCode = 500;
                return res.end(JSON.stringify(err));
            } else {
                res.statusCode = 200;
                res.write('post article data updated')
                return res.end();
            }

        })
    })

});

//filter data based on ID
handleEmitter.on('GetArticledetailsbyId',(req,res)=>{

    const newurl = new URL(`http://localhost:3002/${req.url}`);
    const search_Params = newurl.searchParams;
    if (search_Params.includes('id')) {
        const id = search_Params.get('id');
        const data_jsonformat = fs.readFileSync(FilePathdirectory, 'utf8');
        const json_Data = JSON.parse(data_jsonformat);
        const articlesdtaa = json_Data.filter(x => x.id == id);
        console.log(articlesdtaa);
        if(articlesdtaa==''){
            res.statusCode = 404;
            return  res.end('Requested data not found');
        }
        else{
            res.statusCode = 200;
            res.write(JSON.stringify(articlesdtaa))
            console.log(articlesdtaa,"123456");
            return res.end();
        }

    }
});

//delete a particular data based on fetched ID
handleEmitter.on('deleteArticlebyusingId',(req,res)=>{
    const urldata = new URL(`http://localhost:3002/${req.url}`);
    const search_Params = urldata.searchParams;
    if (search_Params.includes('id')) {
        const articleid = search_Params.get('id');
        const fileconverteddata = fs.readFileSync(FilePathdirectory, 'utf8');
        const jsondata = JSON.parse(fileconverteddata);
        const article = jsondata.filter(x => x.id != articleid);
       
        fs.writeFile(FilePathdirectory,JSON.stringify(article),(error)=>{
            if(error){
                res.statusCode = 500;
                return res.end(JSON.stringify(error));
                }
                else{
                    res.statusCode = 200;
                    return res.end('requested dtaa deleted successfully...');
                    }
        })
    }
})

server.on('request', (req, res) => {
    const req_method = req.method;
    const requrldata= req.url;

    if (req_method == 'GET' && requrldata =='/articles') {
        handleEmitter.emit('GET/articleall', req, res);
    }
    else if (req_method == 'post' && requrldata =='/articles') {
        handleEmitter.emit('post/articlepostdata', req, res)
    }
    else if(req_method == 'GET' && requrldata.includes('/articles?id')){
        
        handleEmitter.emit('GetArticledetailsbyId',req,res);
    }
    else if(req_method == 'DELETE' && requrldata.includes('/articles?id')){
        console.log(req_method, requrldata)
        handleEmitter.emit('deleteArticlebyusingId', req,res);
    }
 
})

server.listen(3002, (err) => {
    if (err) {
        console.log(err);
    }
    else {
        console.log('server is running on port 3002');
    }
})
