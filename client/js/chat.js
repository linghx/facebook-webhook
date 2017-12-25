"use strict"
$(function(){
	
	
	Chat.msgData = {};  //聊天记录
	Chat.moreMsgFlag = {}; //是否有更多聊天记录标志
	Chat.userData = []; //联系人
	Chat.msgImgs = {index: 0, arr: [], count: 0}; //消息中图片懒加载  {id: '', url: ''}
	Chat.roomHeight = {}; //聊天室高度，加载更多聊天消息时，记录当前room height，更新dom后获取新的 room height，滚动条返回2者的差值高度
	// 获取聊天列表
	Chat.getFbMsgUserList('', function(data){
		Chat.userData = Chat.formatUserData(data);
		initUserList(Chat.userData);
		initChatMsgData(Chat.userData,Chat.msgData);
	});
	
	
	function initChatMsgData(userData,msgData){
		userData.forEach(function(item,index){
			msgData[item.psId+''] = [];
			//初始值 true，默认还有更多记录,若请求历史记录接口返回的数据量比指定返回的 num 小，则判定无更多记录；
			Chat.moreMsgFlag[item.psId+''] = true;
		})
	}
	
	function initUserList(userData){

		$("#messagesList").setTemplateElement("messagesBoxTmp"); 
		$("#messagesList").processTemplate({data: userData});
		$('#messagesList li').on('click', handleUserItemClick);
	}
	Chat.updateUserList = function(){
		$('#messagesList li').off('click', handleUserItemClick);
		$("#messagesList").processTemplate({data: Chat.userData});
		// 当前active状态的聊天对象
		Chat.speaker? $("#user"+Chat.speaker.psId).addClass('active') : null;
		$('#messagesList li').on('click', handleUserItemClick);
	}
	function handleUserItemClick(){
		if(!$(this).hasClass('active')) {
			$('#messagesList li').removeClass('active') && $(this).addClass('active');
			var psId = $(this).attr('data-psId');
			Chat.speaker = getUserDataByPsid(psId);			
			
			$("#user"+psId).removeClass('unread');
			
			$('#chatRoomBox .fbm-chat-room').removeClass('fbm-chat-active');
			if($('#'+psId).length){
				$('#'+psId).addClass('fbm-chat-active');
			}else{
				//聊天室结构
				chatRoomHtml(Chat.speaker);
				Chat.getHistoryMsg(Chat.addresser.pageId, psId,'', '', 20, function(data){
					data.length < 20 ? Chat.moreMsgFlag[psId+''] = false : null;
					//格式化后的消息数据
					Chat.msgData[psId+''] = formatHistoryMsgData(data);
					// 消息列表
					msgListHtml(Chat.speaker, Chat.msgData[psId+'']);
					scrollToBottom();
				})
				//监听scroll 上拉获取更多聊天记录
				$('.fbm-chat-active .fbm-msg-box').scroll(listenActiveChatScrollTop)
			}
			//更新消息的读取状态
			Chat.speaker.readFlag == 0 ? Chat.updateReadFlag(Chat.speaker.id) : null;
		}
		
	}
	
	//上拉获取更多聊天记录
	//$('.fbm-chat-active .fbm-msg-box').scroll(listenActiveChatScrollTop)
	function listenActiveChatScrollTop(){
		if($(this).scrollTop() == 0 && Chat.moreMsgFlag[Chat.speaker.psId+'']) {
			//记录当前 room height
			Chat.roomHeight[Chat.speaker.psId+''] = $('#'+Chat.speaker.psId + ' .fbm-msg-list').height();
			getMoreMsgData(Chat.speaker.psId)
		}
	}
	
	function getMoreMsgData(psId){
		Chat.getHistoryMsg(Chat.addresser.pageId, psId, Chat.msgData[psId+''][0].time-1, '', 20, function(data){
			data.length < 20 ? Chat.moreMsgFlag[psId+''] = false : null;
			
			if(data.length) {
				var formatData = formatHistoryMsgData(data);
				Chat.msgData[psId+''] = formatData.concat(Chat.msgData[psId+'']);
				msgListHtml(Chat.speaker, formatData, true);
				//滚动到加载更多消息之前看到的消息位置
				$('.fbm-chat-active .fbm-msg-box').scrollTop($('#'+Chat.speaker.psId + ' .fbm-msg-list').height() - Chat.roomHeight[Chat.speaker.psId+''])
			}
		})
	}
	
	
	function chatRoomHtml(userdata) {
		var html = '';
		html += '<div class="fbm-chat-room fbm-chat-active" id="'+userdata.psId+'"><div class="fbm-msg-box">';
		html += '<div class="fbm-msg-header"><img class="fbm-header-avatar" src="'+userdata.psAvatar+'" height="40" width="40"/>';
		html += '<div class="fbm-header-info"><div class="fbm-header-name">'+userdata.psNickName+'</div><div class="fbm-header-what">'+'Facebook People'+'</div></div></div>';
		html += '<div class="fbm-msg-body"><ul class="fbm-msg-list"></ul></div></div>';
		html += '<div class="fbm-text-box"><div class="fbm-text-left">';
		html += '<input class="fbm-text-input" type="text" placeholder="输入消息..." /></div>';
		html += '<div class="fbm-text-right"><span class="fbm-file-icon">';
		html += '<input class="fbm-text-file" type="file" multiple accept="*" title="添加文件" /></span>';
		html += '<button class="fbm-text-send" type="button">发送</button>';
		html += '</div></div></div>';
		$('#chatRoomBox').append(html)
	}
	// beforeFlag：true  插入到目标元素内部前端
	function msgListHtml(userdata, msgData, beforeFlag) {
		var html = '';
		if(msgData.length){
			var sendUserImg = Chat.addresser.pageAvatar;
			html += '<li class="fbm-msg-item"><div class="fbm-msg-date">'+formatDate(msgData[0].time, true)+'</div></li>';

			msgData.forEach(function(item, index){
				
				// 判断是否加入消息时间
				if(index > 0 && isShowMsgDate(msgData[index-1].time, item.time)){
					html += '<li class="fbm-msg-item"><div class="fbm-msg-date">'+formatDate(item.time, true)+'</div></li>';
				}
				//当前用户发送的消息
				if(item.addresser == pageId) {
					html += messageHtml(sendUserImg, item, true);
				}else{
					var avatar = getUserDataByPsid(item.addresser).psAvatar;
					html += messageHtml(avatar, item, false);
				}
			})
			beforeFlag ? $('#'+userdata.psId + ' .fbm-msg-list').prepend(html) : $('#'+userdata.psId + ' .fbm-msg-list').append(html);
			lazyloadImgs(Chat.msgImgs.arr)
		}
		
	}
	
	//消息类型，从1开始
	var msgType = ["", "text", "image", "file", "location", "video", "fallback", "audio"];
	
	//将后台返回的消息数据格式化成socket.io数据格式
	function formatHistoryMsgData(arrData) {
		var formatData = [];
		for(var i=arrData.length-1;i>=0;i--) {
			var data = arrData[i];
			data.content = JSON.parse(data.content);
			
			var tmp = {
				"addresser": data.senderId, 
				"recipient": data.recipientId,  
				"time": data.timestamp,
				"body": {
					"message": {}
				}
			};
			
			if(data.type == 1) {
				tmp.body.message.text = data.content.text;
				
			}else if(data.type != 4) {
				tmp.body.message = {
					"attachment": {
						"type": msgType[data.type],
						"payload": {
							"url": data.content.url
						}
					}
				}
			}else if(data.type == 4) {
				tmp.body.message = {
					"attachment": {
						"type": msgType[data.type],
						"payload": {
							"location": data.content.location
						}
					}
				}
			}
			
			formatData.push(tmp)
		}
		
		return formatData;
	}
	
	var msgWords = {
		"2": "照片",
		"3": "文件",
		"4": "定位",
		"5": "视频",
		"6": "新消息",
		"7": "音频"
	};
	//格式化 用户数据 psExtendInfo
	Chat.formatUserData =  function (arrData){
		for(var i=0;i<arrData.length;i++) {
			var data = arrData[i],
				sMsg = '',
				name = ''; //发送方名称
				
			data.psExtendInfo = JSON.parse(data.psExtendInfo);
			if(data.psExtendInfo.type == 1) {
				data.psExtendInfo.senderId == data.psId ? null : name = '你: ';
				sMsg = data.psExtendInfo.text;
			}else{
				data.psExtendInfo.senderId == data.psId ? name = data.psNickName : name = '你';
				sMsg = " 发送了"+msgWords[data.psExtendInfo.type]
			}
			data.lastMsg = name + sMsg;
		}
		return arrData
		
	}
	//线上    //shop.onloon.net/socket  测试ws://47.90.48.72:1337
	var socket = io.connect('ws://47.90.48.72:1337'); 
	// 正在连接
	socket.on('connecting', function () {
		console.log('connecting');
	});

	// 连接上
	socket.on('connect', function () {
		console.log('connect');
		// 请求加入
		pageId = pageId || fGetCookie('pageId');
		if(pageId){
			console.log('register')
			socket.emit('new user', pageId);
		}
	});
	
	// 第一次登陆接收其它成员信息
	socket.on('login', function (user) {
		
	});
	
	// 接收私聊信息
	socket.on('receive private message', function (data) {
		//console.log('receive p msg: ',JSON.stringify(data))
		if(data.addresser == data.recipient) return;
		// 消息发送方是否在聊天列表中
		var otherPsid = data.addresser;
		if(!searchUserData('psId',otherPsid)) {
			console.log('new user msg')
			//请求接口，获取发送方信息，更新用户列表数据和UI
			listenNewUserComming(otherPsid)
		}else{
			Chat.msgData[otherPsid+''].push(data);
			//若有聊天室，消息插入UI
			if($('#'+otherPsid).length) {
				handleReceiveMsg(data)
			}
			// 判断消息状态,更新联系人UI
			updateMsgToUserList(data,false);
			
			//若接受的是 Chat.speaker 的消息，更新消息已读状态
			if(Chat.speaker && Chat.speaker.psId == data.addresser) {
				Chat.updateReadFlag(Chat.speaker.id);
			}
		}
		
		scrollToBottom();
	});
	
	
	// 连接失败
	socket.on('disconnect', function () {
		console.log('you have been disconnected');
	});

	// 重连
	socket.on('reconnect', function () {
		console.log('you have been reconnected');
		if (pageId) {
	      socket.emit('new user', pageId);
	    }
	});

	// 监听重连错误 会多次尝试
	socket.on('reconnect_error', function () {
		console.log('attempt to reconnect has failed');
	});
	
	//监听 新聊天用户
	function listenNewUserComming(psId) {
		setTimeout(function() {
			Chat.getFbMsgUserList('', function(data){
				var formatData = Chat.formatUserData(data);
				
				if(searchUserData('psId',psId,formatData)) {
					Chat.userData = formatData;
					Chat.updateUserList()
				}else {
					listenNewUserComming(psId)
				}
			});
		},20000)
	}
	
	/*发送文本信息*/
	$(document).on('click','.fbm-chat-active .fbm-text-send',sendTextMsg);

	document.onkeydown = function(e) {
		var event = window.event || e;
		if(event && event.keyCode == 13) {
			if($('.fbm-chat-active').length<1)return false;
			sendTextMsg()
		}
	}
	
	//发送消息 isSendMsg:true 接受消息 isSendMsg:false
	function updateMsgToUserList(data,isSendMsg){
		if(isSendMsg) {
			$('#user'+Chat.speaker.psId+' .fbm-chat-item-msg').html('你：'+data.lastMsg);
			$('#user'+Chat.speaker.psId+' .fbm-chat-item-time').html(formatDate(data.lastMsgTime));
		}else {
			var html = '',
				msg = data.body.message;
			if(msg.text){
				html = msg.text;
			}else if(msg.attachment){
				
				var name = $('#user'+data.addresser+' .fbm-chat-item-name').html();
				if(msg.attachment.type === 'image') {
					html = name+' 发送了照片';
				}else if(msg.attachment.type === 'audio'){
					html = name+' 发送了音频';
				}else if(msg.attachment.type === 'video'){
					html = name+' 发送了视频';
				}else if(msg.attachment.type === 'file'){
					html = name+' 发送了文件';
				}else {
					html = name+' 发送了新消息';
				}
			}
			$('#user'+data.addresser+' .fbm-chat-item-msg').html(html);
			$('#user'+data.addresser+' .fbm-chat-item-time').html(formatDate(data.time));
			
			//未显示的聊天消息，切换未读样式
			if(!Chat.speaker || Chat.speaker.psId != data.addresser) {
				$('#user'+data.addresser).addClass('unread');
			}
		}
	}
	
	function sendTextMsg(){
		
		var val = $('.fbm-chat-active .fbm-text-input').val();
		if(!val)return false;
		val.length > 640 ? val = val.substr(0,641) : null;
		var headImg = Chat.addresser.pageAvatar,
			tmp = '',
			time = new Date().getTime();
		
		var req = {
			"addresser": pageId, 
			"recipient": Chat.speaker.psId, 
			"time": time,
			"body": {
				"message": {
				  "text": val
				}
			}
		};
			
		// 判断是否加入消息时间
		var msgData = Chat.msgData[Chat.speaker.psId];
		if(msgData.length == 0 || isShowMsgDate(msgData[msgData.length-1].time,time)) {
			tmp += '<li class="fbm-msg-item"><div class="fbm-msg-date">'+formatDate(time, true)+'</div></li>';
		}
		tmp += messageHtml(headImg, req, true);
		$('.fbm-chat-active .fbm-msg-list').append(tmp);
		scrollToBottom();
		
		msgData.push(req);
		socket.emit('send private message', req);
		$('.fbm-chat-active .fbm-text-input').val('');
		updateMsgToUserList({lastMsgTime: time, lastMsg: val},true);
		sortUserListByLastMsgTime(Chat.speaker.psId);
	}
	
	/*接受消息*/
	function handleReceiveMsg(data){
		var userData = getUserDataByPsid(data.addresser);
		var val = null;
		var tmp = '';
		// 判断是否加入消息时间
		var msgData = Chat.msgData[userData.psId];
		
		if(msgData.length <= 1 || isShowMsgDate(msgData[msgData.length-1].time,data.time)) {
			tmp += '<li class="fbm-msg-item"><div class="fbm-msg-date">'+formatDate(data.time, true)+'</div></li>';
		}
		
		tmp += messageHtml(userData.psAvatar, data, false);
		$('#'+userData.psId + ' .fbm-msg-list').append(tmp);
		sortUserListByLastMsgTime(userData.psId)
		lazyloadImgs(Chat.msgImgs.arr)
	}
	
	//消息显示模板, 发送消息 isSendMsg:true 接受消息 isSendMsg:false
	function messageHtml(avatar,data,isSendMsg){
		var html = '',
			msg = '',
			sClass;
			
		if(data.body.message.text) {
			msg = data.body.message.text
		}
		else if(data.body.message.attachment) {
			msg = "消息暂时不支持显示，请到Facebook查看";
			var attachment = data.body.message.attachment;
			if(attachment.type === 'image') {
				Chat.msgImgs.arr.push({id: "lazyloadImgs"+Chat.msgImgs.count, url: attachment.payload.url});
				msg = '<img class="fbm-msg-img" id="lazyloadImgs'+Chat.msgImgs.count+'" src="../images/loading.gif" />'; //
				Chat.msgImgs.count++;
			}else if(msg.attachment.type === 'audio'){
				msg = '<i class="fbm-warn-icon">!</i>音频' + msg //<audio class="fbm-msg-audio" src="'+attachment.payload.url+'"></audio>
			}else if(msg.attachment.type === 'video'){
				msg = '<i class="fbm-warn-icon">!</i>视频' + msg //<video class="fbm-msg-video" src="'+attachment.payload.url+'"></video>
			}else if(msg.attachment.type === 'file'){
				msg = '<i class="fbm-warn-icon">!</i>文件' + msg
			}
		}
		isSendMsg ? sClass = 'sender' : sClass = 'receiver';
		html += '<li class="fbm-msg-item"><div class="fbm-msg-content '+sClass+'"><img class="fbm-'+sClass+'-img" width="32" height="32" src="'+avatar+'"/><span>'+msg+'</span></div></li>';
		return html;
	}
	
	function sortUserListByLastMsgTime(psId) {
		for (var i=0;i<Chat.userData.length;i++) {
			if(Chat.userData[i].psId == psId && i) {
				Chat.userData.unshift(Chat.userData.splice(i,1)[0]);
				Chat.updateUserList();
				break;
			}
		}
	}
	
	//检查 Chat.userData是否有被检测的数据
	function searchUserData(key,val,userData){
		var data = userData || Chat.userData;
		var flag = false;
		for (var i=0;i<data.length;i++) {
			if(data[i][key+''] === val) {
				flag = true;
				break;
			}
		}
		return flag;
	}
	
	function getUserDataByPsid(psId){
		var data = Chat.userData;
		var user;
		for (var i=0;i<data.length;i++) {
			if(data[i].psId == psId) {
				user = data[i];
				break;
			}
		}
		return user;
	}
	/*
	 消息间隔大于30m显示最新消息时间，参数为Date对象的毫秒值*/
	function isShowMsgDate(lastTime,curTime){
		if((curTime - lastTime)/(1000*60) > 30) {
			return true;
		}
		return false;
	}
	
	function scrollToBottom(){
		$('.fbm-chat-active .fbm-msg-box').scrollTop($('.fbm-chat-active .fbm-msg-list').height());
	}
	
	
	function lazyloadImgs(arr) {
		for(var i=Chat.msgImgs.index;i<Chat.msgImgs.count;i++) {
			var img = new Image();
			img.src = arr[i].url;
			img.onload = (function(i,img){
				var timer = setInterval(function () {
					if(img.complete) {
						$('#'+arr[i].id).attr('src',arr[i].url);
						clearInterval(timer);
					}
				},100)
			})(i,img)
		}
		Chat.msgImgs.index = i;
	}
})


