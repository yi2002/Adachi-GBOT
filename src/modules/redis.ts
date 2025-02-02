import { createClient, RedisClient } from "redis";
import { Logger } from "log4js";
import FileManagement from "./file";

export const __RedisKey = {
	/* GUILD */
	GUILD_BAN: "adachi.banned-guild", //被ban掉的频道
	GUILD_USED: "adachi.guild-used", //BOT所在所有频道
	GUILD_USED_CHANNEL: "adachi.guild-used-channel", //频道主动消息子频道
	GUILD_MASTER: "adachi.guild-master", //BOT主人所在的检测到的第一个频道
	GUILD_INFO: "adachi.guild-info", //频道详细信息
	GUILD_TEMP_MSG_ID: "adachi.msgId-temp", //频道暂存主动推送使用msgId，减少主动次数
	
	/* USER */
	USER_BOT_ID: "adachi.user-bot-id", //BOT ID
	USER_INFO: "adachi.user-info", //泛获取用户的基本信息
	USER_USED_GUILD: "adachi.user-used-guild", //用户使用过BOT的所有频道
	
	/* Command */
	COMMAND_STAT: "adachi.command-stat",
	COMMAND_LIMIT_USER: "adachi.command-limit-user",
	COMMAND_LIMIT_GUILD: "adachi.command-limit-guild",
	
	/* Management */
	AUTH_LEVEL: "adachi.auth-level",
	CHANNEL_LIMIT: "adachi.channel-limit", //设置可用子频道
	BANED_GUILD: "adachi.banned-guild",
	
	/* Function */
	RESTART_PARAM: "adachi.restart-param", //指令重启后保存启动回复消息路径
	HELP_DATA: "adachi.help-data",
	MESSAGE_CALL_PASSIVE: "adachi.message-call-passive",
	MESSAGE_CALL_INITIATIVE: "adachi.message-call-initiative",
	PLUGIN_UPDATE_TIME: "adachi.plugin-update-time",
	BOT_UPDATE_TIME: "adachi.bot-update-time"
	
}

interface DatabaseMethod {
	setTimeout( key: string, time: number ): Promise<void>;
	
	deleteKey( ...keys: string[] ): Promise<void>;
	
	getKeysByPrefix( prefix: string ): Promise<string[]>;
	
	/* Hash */
	setHash( key: string, value: any ): Promise<void>;
	
	getHash( key: string ): Promise<any>;
	
	delHash( key: string, ...fields: string[] ): Promise<void>;
	
	incHash( key: string, field: string, increment: number ): Promise<void>;
	
	existHashKey( key: string, field: string ): Promise<boolean>;
	
	/* String */
	setString( key: string, value: any, timeout?: number ): Promise<void>;
	
	getString( key: string ): Promise<string | null>;
	
	/* List */
	getList( key: string ): Promise<string[]>;
	
	getListLength( key: string ): Promise<number>;
	
	addListElement( key: string, ...value: any[] ): Promise<void>;
	
	delListElement( key: string, ...value: any[] ): Promise<void>;
	
	existListElement( key: string, value: any ): Promise<boolean>;
	
	/* Set */
	getSet( key: string ): Promise<string[]>;
	
	getSetMemberNum( key: string ): Promise<number>;
	
	addSetMember( key: string, ...value: any[] ): Promise<void>;
	
	delSetMember( key: string, ...value: any[] ): Promise<void>;
	
	existSetMember( key: string, value: any ): Promise<boolean>;
}

export default class Redis implements DatabaseMethod {
	public readonly client: RedisClient;
	
	constructor( port: number, auth_pass, logger: Logger, file: FileManagement ) {
		const host: string = process.env.docker === "yes" ? "redis" : "localhost";
		
		this.client = createClient( port, host, { auth_pass } );
		this.client.on( "connect", async () => {
			logger.debug( "Redis 数据库已连接" );
		} );
	}
	
	public async setTimeout( key: string, time: number ): Promise<void> {
		this.client.expire( key, time );
	}
	
	public async deleteKey( ...keys: string[] ): Promise<void> {
		for ( let k of keys ) {
			this.client.del( k );
		}
	}
	
	public async getKeysByPrefix( prefix: string ): Promise<string[]> {
		return new Promise( ( resolve, reject ) => {
			this.client.keys( prefix + "*", ( error: Error | null, keys: string[] ) => {
				if ( error !== null ) {
					reject( error );
				} else {
					resolve( keys || [] );
				}
			} );
		} );
	}
	
	public async setHash( key: string, value: any ): Promise<void> {
		this.client.hmset( key, value );
	}
	
	public async getHash( key: string ): Promise<any> {
		return new Promise( ( resolve, reject ) => {
			this.client.hgetall( key, ( error: Error | null, data: { [key: string]: string } ) => {
				if ( error !== null ) {
					reject( error );
				} else {
					resolve( data || {} );
				}
			} );
		} );
	}
	
	
	//hset操作
	public async setHashField( key: string, field: string, value: any ): Promise<void> {
		this.client.hmset( key, field, value );
	}
	
	//hget操作
	public async getHashField( key: string, field: string ): Promise<string> {
		return new Promise( ( resolve, reject ) => {
			this.client.hget( key, field, ( error: Error | null, data: string | null ) => {
				if ( error !== null ) {
					reject( error );
				} else {
					resolve( data || "" );
				}
			} );
		} );
	}
	
	public async delHash( key: string, ...fields: string[] ): Promise<void> {
		this.client.hdel( key, fields );
	}
	
	public async incHash( key: string, field: string, increment: number ): Promise<void> {
		if ( parseInt( increment.toString() ) === increment ) {
			this.client.hincrby( key, field, increment );
		} else {
			this.client.hincrbyfloat( key, field, increment );
		}
	}
	
	public async incKey( key: string, increment: number ): Promise<void> {
		if ( parseInt( increment.toString() ) === increment ) {
			this.client.incrby( key, increment );
		} else {
			this.client.incrbyfloat( key, increment );
		}
	}
	
	public async existHashKey( key: string, field: string ): Promise<boolean> {
		return new Promise( ( resolve, reject ) => {
			this.client.hexists( key, field, ( error: Error | null, data: number ) => {
				if ( error !== null ) {
					reject( false );
				} else {
					resolve( data === 1 );
				}
			} );
		} );
	}
	
	public async setString( key: string, value: any, timeout?: number ): Promise<void> {
		if ( timeout === undefined ) {
			this.client.set( key, value );
		} else {
			this.client.setex( key, timeout, value );
		}
	}
	
	public async getString( key: string ): Promise<string> {
		return new Promise( ( resolve, reject ) => {
			this.client.get( key, ( error: Error | null, data: string | null ) => {
				if ( error !== null ) {
					reject( error );
				} else {
					resolve( data || "" );
				}
			} );
		} );
	}
	
	public async getTimeOut( key: string ): Promise<number> {
		return new Promise( ( resolve, reject ) => {
			this.client.ttl( key, ( error: Error | null, data: number | null ) => {
				if ( error !== null ) {
					reject( error );
				} else {
					resolve( data || -2 );
				}
			} );
		} );
	}
	
	public async getList( key: string ): Promise<string[]> {
		return new Promise( ( resolve, reject ) => {
			this.client.lrange( key, 0, -1, ( error: Error | null, data: string[] ) => {
				if ( error !== null ) {
					reject( error );
				} else {
					resolve( data || [] );
				}
			} );
		} );
	}
	
	public async getListLength( key: string ): Promise<number> {
		return new Promise( ( resolve, reject ) => {
			this.client.llen( key, ( error: Error | null, length: number ) => {
				if ( error !== null ) {
					reject( error );
				} else {
					resolve( length || 0 );
				}
			} );
		} );
	}
	
	public async getListByIndex( key: string, index: number ): Promise<string> {
		return new Promise( ( resolve, reject ) => {
			this.client.lindex( key, index, ( error: Error | null, data: string ) => {
				if ( error !== null ) {
					reject( error );
				} else {
					resolve( data || "" );
				}
			} );
		} );
	}
	
	public async addListElement( key: string, ...value: any[] ): Promise<void> {
		this.client.rpush( key, value );
	}
	
	public async delListElement( key: string, ...value: any[] ): Promise<void> {
		for ( let v of value ) {
			this.client.lrem( key, 0, v );
		}
	}
	
	public async existListElement( key: string, value: any ): Promise<boolean> {
		const list: string[] = await this.getList( key );
		return list.includes( value.toString() );
	}
	
	public async getSet( key: string ): Promise<string[]> {
		return new Promise( ( resolve, reject ) => {
			this.client.smembers( key, ( error: Error | null, data: string[] ) => {
				if ( error !== null ) {
					reject( error );
				} else {
					resolve( data || [] );
				}
			} );
		} );
	}
	
	public async getSetMemberNum( key: string ): Promise<number> {
		return new Promise( ( resolve, reject ) => {
			this.client.scard( key, ( error: Error | null, data: number ) => {
				if ( error !== null ) {
					reject( error );
				} else {
					resolve( data || 0 );
				}
			} );
		} );
	}
	
	public async addSetMember( key: string, ...value: any[] ): Promise<void> {
		this.client.sadd( key, value );
	}
	
	public async delSetMember( key: string, ...value: any[] ): Promise<void> {
		this.client.srem( key, value );
	}
	
	public async existSetMember( key: string, value: any ): Promise<boolean> {
		return new Promise( ( resolve, reject ) => {
			this.client.sismember( key, value, ( error: Error | null, data: number ) => {
				if ( error !== null ) {
					reject( false );
				} else {
					resolve( data === 1 );
				}
			} );
		} );
	}
}