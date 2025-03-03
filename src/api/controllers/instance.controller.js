const { WhatsAppInstance } = require('../class/instance')
const fs = require('fs')
const path = require('path')
const config = require('../../config/config')
const { Session } = require('../class/session')

exports.init = async (req, res) => {
	let webhook
if (req.query.webhook === null || req.query.webhook === undefined) {
  webhook = config.webhookEnabled
} else {
  webhook = req.query.webhook
}

let webhookUrl
if (req.query.webhookUrl  === null || req.query.webhookUrl === undefined) {
  webhookUrl = config.webhookUrl
} else {
  webhookUrl = req.query.webhookUrl
}

    const key = req.query.key
    //const webhook = !req.query.webhook ? false : config.webhookEnabled
   //const webhookUrl = !req.query.webhookUrl ? null : config.webhookUrl
    const appUrl = config.appUrl || req.protocol + '://' + req.headers.host
    const instance = new WhatsAppInstance(key, webhook, webhookUrl)
    const data = await instance.init()
    WhatsAppInstances[data.key] = instance
    res.json({
        error: false,
        message: 'Instancia iniciada',
        key: data.key,
        webhook: {
            enabled: webhook,
            webhookUrl: webhookUrl,
        },
        qrcode: {
            url: appUrl + '/instance/qr?key=' + data.key,
        },
        browser: config.browser,
    })
}

exports.ativas = async (req, res) => {
    if (req.query.active) {
        let instance = []
        const db = mongoClient.db('whatsapp-api')
        const result = await db.listCollections().toArray()
        result.forEach((collection) => {
            instance.push(collection.name)
        })

        return res.json({
            
            data: instance
        })
    }

    let instance = Object.keys(WhatsAppInstances).map(async (key) =>
        WhatsAppInstances[key].getInstanceDetail(key)
    )
    let data = await Promise.all(instance)
    
    return {
        data: data
    }
}

exports.qr = async (req, res) => {
	 const verifica = await exports.validar(req, res)
	if(verifica==true)
		{
			const instance = WhatsAppInstances[req.query.key]
    let data
    try {
        data = await instance.getInstanceDetail(req.query.key)
    } catch (error) {
        data = {}
    }
		if(data.phone_connected===true)
			{
		return res.json({
        error: true,
        message: 'Telefone já conectado'
    })
				
			}
			else
				{
					
				
			
			
	
    try {
        const qrcode = await WhatsAppInstances[req.query.key]?.instance.qr
        res.render('qrcode', {
            qrcode: qrcode,
        })
    } catch {
        res.json({
            qrcode: '',
        })
    }
		}
}
else
	{
		return res.json({
        error: true,
        message: 'Instâcncia não existente'
    })
		
	}
}

exports.qrbase64 = async (req, res) => {
	 const verifica = await exports.validar(req, res)
	if(verifica==true)
		{
			const instance = WhatsAppInstances[req.query.key]
    let data
    try {
        data = await instance.getInstanceDetail(req.query.key)
    } catch (error) {
        data = {}
    }
		if(data.phone_connected===true)
			{
		return res.json({
        error: true,
        message: 'Telefone já conectado'
    })
				
			}
			else
				{
					
				
			
			
	
    try {
        const qrcode = await WhatsAppInstances[req.query.key]?.instance.qr
        res.json({
            error: false,
            message: 'QR Base64 fetched successfully',
            qrcode: qrcode,
        })
    } catch {
        res.json({
            qrcode: '',
        })
    }
		}
}
else
	{
		return res.json({
        error: true,
        message: 'Instâcncia não existente'
    })
		
	}
}

exports.validar = async(req, res) =>
{
	const verifica = await exports.ativas(req, res)
	const existe = verifica.data.some(item => item.instance_key === req.query.key)
	if(existe)
		{
			return true
		}
	else
		{
			return false
		}
}

exports.info = async (req, res) => {
	 const verifica = await exports.validar(req, res)
	if(verifica==true)
		{
    const instance = WhatsAppInstances[req.query.key]
    let data
    try {
        data = await instance.getInstanceDetail(req.query.key)
    } catch (error) {
        data = {}
    }
    return res.json({
        error: false,
        message: 'Instance fetched successfully',
        instance_data: data,
    })
		}
	else
		{
			return res.json({
        error: true,
        message: 'Instâcncia não existente'
    })
			
		}
}

exports.restore = async (req, res, next) => {
    try {
        const session = new Session()
        let restoredSessions = await session.restoreSessions()
        return res.json({
            error: false,
            message: 'All instances restored',
            data: restoredSessions,
        })
    } catch (error) {
        next(error)
    }
}

exports.logout = async (req, res) => {
    let errormsg
    try {
        await WhatsAppInstances[req.query.key].instance?.sock?.logout()
    } catch (error) {
        errormsg = error
    }
    return res.json({
        error: false,
        message: 'logout successfull',
        errormsg: errormsg ? errormsg : null,
    })
}

exports.delete = async (req, res) => {
    let errormsg
	 const verifica = await exports.validar(req, res)
	if(verifica==true)
		{
    try {
        await WhatsAppInstances[req.query.key].deleteInstance(req.query.key)
        delete WhatsAppInstances[req.query.key]
    } catch (error) {
        errormsg = error
    }
    return res.json({
        error: false,
        message: 'Instance deleted successfully',
        data: errormsg ? errormsg : null,
    })
		}
	else
		{
			return res.json({
        error: false,
        message: 'Instance deleted successfully',
        data: errormsg ? errormsg : null,
    })
			
		}
}

exports.list = async (req, res) => {
    if (req.query.active) {
        let instance = []
        const db = mongoClient.db('whatsapp-api')
        const result = await db.listCollections().toArray()
        result.forEach((collection) => {
            instance.push(collection.name)
        })

        return res.json({
            error: false,
            message: 'All active instance',
            data: instance,
        })
    }

    let instance = Object.keys(WhatsAppInstances).map(async (key) =>
        WhatsAppInstances[key].getInstanceDetail(key)
    )
    let data = await Promise.all(instance)
    
    return res.json({
        error: false,
        message: 'All instance listed',
        data: data,
    })
}

