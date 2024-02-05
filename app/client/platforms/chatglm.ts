import { ChatGLM } from "@/app/constant";
import { ChatOptions, getHeaders, LLMApi, LLMModel, LLMUsage } from "../api";

var defaultUserID = 0;

export class ChatGLMApi implements LLMApi {
  path(path: string): string {
    let baseUrl = ChatGLM.ChatEndpoint;
    return [baseUrl, path].join("/");
  }

  extractMessage(res: any) {
    return res.response ?? "";
  }

  async chat(
    options: ChatOptions,
    userMessage?: string,
    history?: any[],
    startTime?: number,
    category?: string,
    status?: string,
    userID?: number,
  ) {
    if (status === "4") {
      options.onFinish(
        `提交成功，结束对话，请您返回完成问卷。您的用户ID是${userID}，请您记住该ID，后续需要填在问卷里。本实验为匿名试验，不会记录您的真实身份信息。`,
        [],
        category,
        status,
        userID,
      );
      return;
    }

    console.log("[Request] chatglm request: user message", userMessage);

    const min = 1;
    const max = 200;
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    if (userID == null || userID === 0) {
      userID = defaultUserID;
      defaultUserID = defaultUserID + 1;
    }
    const requestPayload1 = {
      user: userMessage ?? "",
      history,
      start_time: startTime ?? 0,
      user_id: userID,
      category: category ?? "",
    };

    const chatPath = this.path(ChatGLM.ChatPath);
    const chatPayload = {
      method: "POST",
      body: JSON.stringify(requestPayload1),
      headers: getHeaders(),
    };

    let responseData1: any;
    let responseData2: any;

    try {
      console.log("[Request] chatglm payload: ", chatPayload);
      const response = await fetch(chatPath, chatPayload);

      console.log("[Request] chatglm response", response);
      responseData1 = await response.json();
      console.log(responseData1);
    } catch (e) {
      console.log("[Request] failed to make a chat request", e);
      options.onError?.(e as Error);
    }

    let isGetChatResponse = false;

    let latestStatus = "";

    function delay(ms: any) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    let index = 0;

    while (!isGetChatResponse && index < 10) {
      const requestPayload2 = {
        request_id: responseData1.request_id,
      };
      const chatPath2 = ChatGLM.ChatEndpoint + "/get_task";
      const chatPayload2 = {
        method: "POST",
        body: JSON.stringify(requestPayload2),
        headers: getHeaders(),
      };
      try {
        console.log("[Request] chatglm payload: ", chatPayload2);
        const response = await fetch(chatPath2, chatPayload2);
        console.log("[Request] chatglm response", response);
        responseData2 = await response.json();
        console.log("[Response2]", responseData2);
        if (responseData2.status !== "1") {
          latestStatus = responseData2.status;
          isGetChatResponse = true;
        } else {
          index = index + 1;
        }
      } catch (e) {
        console.log("[Request] failed to make a chat request", e);
        options.onError?.(e as Error);
      }

      await delay(1000);
    }

    if (index === 10) {
      options.onFinish(
        "很抱歉，系统出现问题，给您带来不愉快的体验，请您重新提问。",
      );
    }

    if (latestStatus === "3") {
      options.onFinish(
        responseData2.response,
        [],
        responseData2.category,
        responseData2.status,
        responseData2.user_id,
      );
    } else {
      options.onFinish(
        responseData2.response,
        responseData2.history,
        responseData2.category,
        responseData2.status,
        responseData2.user_id,
      );
    }
  }
  async usage() {
    return {
      used: 1,
      total: 9999999999,
    } as LLMUsage;
  }

  async models(): Promise<LLMModel[]> {
    return [];
  }
}
export { ChatGLM };
