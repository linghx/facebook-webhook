var Chat = {
	/*fb message消息日志收集----放在node端*/
	"msgLog": function (senderId, recipientId, time, ftype, type, content, sUrl, sLocation) {
		$.ajax({
            type: "POST",
            url: WebConfig.interfaceUrl + "/logs/messageAdd",
            data: {
                senderId: senderId,
                recipientId: recipientId,
                time: time,
                ftype: ftype,
                type: type,
                content: content,
                url: sUrl || '',
                location: sLocation || ''
            },
            dataType: WebConfig.dataTypeJson,
            success: function (json) {
                
            },
            error: function () {
                console.log("msgLog error")
            }
        });
	},
	/*查询历史消息记录*/
	"getHistoryMsg": function (senderId, recipientId, endTime, startTime, num, fCallBack) {
		$.ajax({
            type: "POST",
            url: WebConfig.interfaceUrl + "/count/searchHistoryMessage",
            data: {
                senderId: senderId,
                recipientId: recipientId,
                endTime: endTime || new Date().getTime(),
                startTime: startTime || -1,
                num: num || 10
            },
            dataType: WebConfig.dataTypeJson,
            success: function (json) {
                if (json.success && json.data ) {
	            	fCallBack(json.data)
	            } else {
	                alertModel(json.message)
	            }
            },
            error: function () {
                console.log("getHistoryMsg error")
            }
        });
	},
	/*根据店铺卖家 昵称 获取关系列表*/
	"getFbMsgUserList": function (psNickName, fCallBack) {
		$.ajax({
            type: "POST",
            url: WebConfig.interfaceUrl + "/fb/message/getFbMsgUserList",
            data: {
                psNickName: psNickName
            },
            dataType: WebConfig.dataTypeJson,
            success: function (json) {
                if (json.success) {
	            	fCallBack(json.data)
	            } else {
	                alertModel(json.message)
	            }
            },
            error: function () {
                console.log("getFbMsgUserList error")
            }
        });
	},
	/*更新读取状态*/
	"updateReadFlag": function (bindId) {
		$.ajax({
            type: "get",
            url: WebConfig.interfaceUrl + "/fb/message/updateReadFlag",
            data: {
                bindId: bindId
            },
            dataType: WebConfig.dataTypeJson,
            success: function (json) {
                
            },
            error: function () {
                console.log("updateReadFlag error")
            }
        });
	},
};
