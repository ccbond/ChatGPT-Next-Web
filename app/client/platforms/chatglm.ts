import { ChatGLM } from "@/app/constant";
import { useAccessStore } from "@/app/store";
import { ChatOptions, getHeaders, LLMApi, LLMModel, LLMUsage } from "../api";

export class ChatGLMApi implements LLMApi {
  path(path: string): string {
    const accessStore = useAccessStore.getState();
    let baseUrl = accessStore.chatglmUrl;
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
        "提交成功，结束对话，请您返回完成问卷。",
        [],
        category,
        status,
        userID,
      );
    }

    console.log("[Request] chatglm request: user message", userMessage);

    const min = 1;
    const max = 200;
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    if (userID === 0) {
      userID = randomNum;
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

    while (!isGetChatResponse) {
      const requestPayload2 = {
        request_id: responseData1.request_id,
      };
      const chatPath2 = "http://192.168.0.103:5000/get_task";
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
        console.log(responseData2);
        if (responseData2.status !== "1") {
          latestStatus = responseData2.status;
          isGetChatResponse = true;
        }
      } catch (e) {
        console.log("[Request] failed to make a chat request", e);
        options.onError?.(e as Error);
      }
    }

    if (latestStatus === "3") {
      options.onFinish(
        " 请点击按钮选择接受与否。",
        [],
        responseData2.category,
        responseData2.status,
        responseData2.userID,
      );
    } else {
      options.onFinish(
        responseData2.response,
        responseData2.history,
        responseData2.category,
        responseData2.status,
        responseData2.userID,
      );
    }

    // try {
    //   const chatPath = this.path(ChatGLM.ChatPath);
    //   const chatPayload = {
    //     method: "POST",
    //     body: JSON.stringify(requestPayload),
    //     headers: getHeaders(),
    //   };

    //   console.log("[Request] chatglm payload: ", chatPayload);

    //   const response = await fetch(chatPath, chatPayload);

    //   console.log("[Request] chatglm response", response);

    //   const responseData: any = await response.json();
    //   console.log("responsedata", responseData);
    //   options.onFinish(responseData.response, responseData.hisotry);
    // } catch (e) {
    //   console.log("[Request] failed to make a chat request", e);
    //   options.onError?.(e as Error);
    // }
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
