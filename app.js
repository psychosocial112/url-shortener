const express = require('express')
const shortId = require('shortid')
const createHttpError = require('http-errors')
const mongoose = require('mongoose')
const path = require('path')
const { use } = require('express/lib/application')
const ShortUrl = require('./models/url.model')

const app = express()
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({extended:false}))

mongoose.connect('mongodb://localhost:27017/app')
.then(() => console.log('mongoose connected'))  
.catch(error => console.log('Error connecting... '))

app.set('view engine', 'ejs')

app.get('/', async (req, res, next) => {
    res.render('index')
})

app.post('/', async (req, res, next) => {
    try {
        const { url } = req.body 
        if (!url) {
            throw createHttpError.BadRequest('Provide a valid url') // if url putted  does not exist
            
        }
        const urlExist = await ShortUrl.findOne({ url })
        if (urlExist) {
            res.render('index', {short_url: `${req.protocol}://${req.headers.host}/${urlExist.shortId}` }) // if url  putted exist and already gets shorted
                               //short_url: `${req.hostname}/${urlExist.shortId}`   //to deploy in a domain
                return
        }
        const shortUrl = new ShortUrl({url: url, shortId: shortId.generate() }) 
        const result = await shortUrl.save()
        res.render('index', {short_url: `${req.protocol}://${req.headers.host}/${result.shortId}` }) // if url putted exist but it doesn't get shorted: save it and get short url
                           //short_url: `${req.hostname}/${result.shortId}` //to deploy in a domain
    } catch (error) {
        next(error)
    }
})

app.get('/:shortId', async (req, res, next) => {
    try {
        const { shortId } = req.params
        const result = await ShortUrl.findOne({ shortId }) 
        if(!result){
            throw createHttpError.NotFound('Short url does not exist') // if  you search with an url didn't get shorted

        }
        res.redirect(result.url)  // if you search with an url did gets shorted: redirect to the original url
    } catch (error) {
    next(error)
    }
})

app.use((req, res, next) => {
    next(createHttpError.NotFound())
})

app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.render('index', {error: err.message})
})

app.listen(5000, () => console.log("server is on port 5000..."))
