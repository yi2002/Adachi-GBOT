import express from "express";
import bot from "ROOT";
import { Md5 } from 'md5-typescript'
import { getToken } from "@web-console/backend/jwt";

export default express.Router().post( "/", ( req, res ) => {
	const num = <string>req.body.num;
	const pwd = req.body.pwd;
	
	if ( bot.config.webConsole.adminName === num &&
		( pwd === bot.config.webConsole.adminPwd || pwd === Md5.init( bot.config.webConsole.adminPwd ) )
	) {
		res.status( 200 ).send( {
			token: getToken(
				bot.config.webConsole.jwtSecret, parseInt( bot.config.appID )
			)
		} );
	} else {
		res.status( 401 ).send( { msg: "Number or password is incorrect" } );
	}
} );