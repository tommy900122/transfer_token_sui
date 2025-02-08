export function ReponseError(status: number, err: string): Response {
    return new Response(JSON.stringify({ message: err }, filterEmptyValues), {
        status: status,
        headers: {
            'Content-Type': 'application/json', // 设置响应头
        },
    },)
}

export function ReponseOk(data: any): Response {
    return new Response(JSON.stringify({ data: data }, filterEmptyValues), {
        headers: {
            'Content-Type': 'application/json', // 设置响应头
        },
    },)
}


function filterEmptyValues(key: string, value: any): any {
    // 如果值是 undefined、null 或者空字符串，返回 undefined 以在序列化时被忽略
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        return undefined;
    }

    // 如果值是对象，递归处理
    if (typeof value === 'object' && value !== null) {
        return Object.keys(value).reduce((obj, k) => {
            const newValue = filterEmptyValues(k, value[k]);
            if (newValue !== undefined) {
                obj[k] = newValue;
            }
            return obj;
        }, {} as any);
    }

    // 否则，返回原始值
    return value;
}