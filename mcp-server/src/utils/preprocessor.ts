import moment from "moment";

// 컬럼명 표준화 매핑
const columnMapping: { [key: string]: string } = {
  // Amount 관련
  AMOUNT: "amount",
  TRAN_AMT: "amount",
  trans_amt: "amount",
  거래금액: "amount",
  금액: "amount",
  PRICE: "amount",
  price: "amount",
  COST: "amount",
  cost: "amount",
  
  // Timestamp 관련
  시간: "timestamp",
  거래일시: "timestamp",
  거래시간: "timestamp",
  TRAN_TIME: "timestamp",
  trans_time: "timestamp",
  DATE: "timestamp",
  date: "timestamp",
  TIME: "timestamp",
  time: "timestamp",
  
  // User 관련
  USER_ID: "user_id",
  user_id: "user_id",
  고객ID: "user_id",
  고객_ID: "user_id",
  CUSTOMER_ID: "user_id",
  customer_id: "user_id",
  ACCOUNT_ID: "user_id",
  account_id: "user_id",
  
  // Merchant 관련
  MERCHANT_ID: "merchant_id",
  merchant_id: "merchant_id",
  상점ID: "merchant_id",
  STORE_ID: "merchant_id",
  store_id: "merchant_id",
  
  // Transaction Type
  TRAN_TYPE: "transaction_type",
  transaction_type: "transaction_type",
  거래유형: "transaction_type",
  TYPE: "transaction_type",
  type: "transaction_type",
  
  // Channel
  CHANNEL: "channel",
  channel: "channel",
  채널: "channel",
  
  // Status
  STATUS: "status",
  status: "status",
  상태: "status",
  SUCCESS_FLAG: "status",
  success_flag: "status",
  
  // IP Address
  IP_ADDRESS: "ip_address",
  ip_address: "ip_address",
  IP: "ip_address",
  ip: "ip_address",
  
  // Device
  DEVICE_ID: "device_id",
  device_id: "device_id",
  기기ID: "device_id",
};

/**
 * 컬럼명 표준화
 */
export function standardizeColumnNames(row: any): any {
  const standardized: any = {};
  for (const [key, value] of Object.entries(row)) {
    const trimmedKey = key.trim();
    const standardKey = columnMapping[trimmedKey] || trimmedKey.toLowerCase();
    standardized[standardKey] = value;
  }
  return standardized;
}

/**
 * Timestamp 파싱 및 Feature 생성
 */
export function parseTimestamp(timestamp: any): any {
  if (!timestamp) return null;
  
  let parsedMoment: moment.Moment | null = null;
  
  // 다양한 형식 시도
  const formats = [
    "YYYY-MM-DD HH:mm:ss",
    "YYYY-MM-DDTHH:mm:ss",
    "YYYY-MM-DDTHH:mm:ss.SSSZ",
    "YYYY/MM/DD HH:mm:ss",
    "YYYYMMDDHHmmss",
    "X", // Unix timestamp (seconds)
    "x", // Unix timestamp (milliseconds)
  ];
  
  for (const format of formats) {
    if (format === "X" || format === "x") {
      const num = Number(timestamp);
      if (!isNaN(num)) {
        parsedMoment = moment(num, format, true);
        if (parsedMoment.isValid()) break;
      }
    } else {
      parsedMoment = moment(timestamp, format, true);
      if (parsedMoment.isValid()) break;
    }
  }
  
  if (!parsedMoment || !parsedMoment.isValid()) {
    // 마지막 시도: moment 자동 파싱
    parsedMoment = moment(timestamp);
    if (!parsedMoment.isValid()) return null;
  }
  
  const hour = parsedMoment.hour();
  const dayOfWeek = parsedMoment.day(); // 0=일요일, 6=토요일
  const isNight = hour <= 5 || hour >= 22 ? 1 : 0;
  const date = parsedMoment.format("YYYYMMDD");
  
  // 시간 버킷 (3시간 단위)
  let hourBucket = "";
  if (hour >= 0 && hour < 3) hourBucket = "00-03";
  else if (hour >= 3 && hour < 6) hourBucket = "03-06";
  else if (hour >= 6 && hour < 9) hourBucket = "06-09";
  else if (hour >= 9 && hour < 12) hourBucket = "09-12";
  else if (hour >= 12 && hour < 15) hourBucket = "12-15";
  else if (hour >= 15 && hour < 18) hourBucket = "15-18";
  else if (hour >= 18 && hour < 21) hourBucket = "18-21";
  else hourBucket = "21-24";
  
  return {
    hour,
    day_of_week: dayOfWeek,
    is_night: isNight,
    date,
    hour_bucket: hourBucket,
    timestamp_parsed: parsedMoment.toISOString(),
  };
}

/**
 * Amount 파싱 및 로그 스케일
 */
export function parseAmount(amount: any): { amount: number; amount_log: number } {
  let parsedAmount = 0;
  
  if (typeof amount === "string") {
    // 문자열에서 숫자만 추출
    parsedAmount = parseFloat(amount.replace(/[^\d.-]/g, "")) || 0;
  } else if (typeof amount === "number") {
    parsedAmount = amount;
  }
  
  // 로그 스케일 (0 이하 값 처리)
  const amountLog = parsedAmount > 0 ? Math.log1p(parsedAmount) : 0;
  
  return {
    amount: parsedAmount,
    amount_log: amountLog,
  };
}

/**
 * IP 주소에서 국가 코드 추출 (간단한 휴리스틱)
 * 실제로는 GeoIP 라이브러리 사용 권장
 */
export function extractCountryFromIP(ipAddress: string | null | undefined): string {
  if (!ipAddress || typeof ipAddress !== "string") return "UNKNOWN";
  
  // 간단한 휴리스틱 (실제로는 GeoIP DB 사용)
  // 예: 192.168.x.x, 10.x.x.x, 127.x.x.x는 내부 IP
  if (/^(192\.168\.|10\.|127\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(ipAddress)) {
    return "LOCAL";
  }
  
  // 실제 구현에서는 geoip-lite 같은 라이브러리 사용
  // 여기서는 더미로 "KR" 반환
  return "KR";
}

/**
 * 거래 실패 정보 파싱
 */
export function parseFailureInfo(status: any, failReason?: any): {
  is_fail: number;
  fail_type: string;
} {
  const statusStr = String(status || "").toUpperCase();
  const isFail = statusStr !== "SUCCESS" && statusStr !== "200" && statusStr !== "OK" ? 1 : 0;
  
  let failType = "NONE";
  if (isFail) {
    if (failReason) {
      failType = String(failReason).toUpperCase();
    } else {
      failType = statusStr;
    }
  }
  
  return {
    is_fail: isFail,
    fail_type: failType,
  };
}

/**
 * 사용자별 통계 계산
 */
export function calculateUserStats(dataframe: any[], userKey: string = "user_id"): {
  [userId: string]: {
    count: number;
    totalAmount: number;
    avgAmount: number;
    maxAmount: number;
    minAmount: number;
    failCount: number;
    failRate: number;
  };
} {
  const userStats: {
    [userId: string]: {
      count: number;
      totalAmount: number;
      avgAmount: number;
      maxAmount: number;
      minAmount: number;
      failCount: number;
      failRate: number;
      amounts: number[];
    };
  } = {};
  
  dataframe.forEach((row) => {
    const userId = row[userKey];
    if (!userId) return;
    
    if (!userStats[userId]) {
      userStats[userId] = {
        count: 0,
        totalAmount: 0,
        avgAmount: 0,
        maxAmount: 0,
        minAmount: Infinity,
        failCount: 0,
        failRate: 0,
        amounts: [],
      };
    }
    
    const stats = userStats[userId];
    stats.count++;
    
    const amount = row.amount || 0;
    stats.totalAmount += amount;
    stats.amounts.push(amount);
    stats.maxAmount = Math.max(stats.maxAmount, amount);
    stats.minAmount = Math.min(stats.minAmount, amount);
    
    if (row.is_fail === 1) {
      stats.failCount++;
    }
  });
  
  // 평균 및 실패율 계산
  Object.keys(userStats).forEach((userId) => {
    const stats = userStats[userId];
    stats.avgAmount = stats.count > 0 ? stats.totalAmount / stats.count : 0;
    stats.failRate = stats.count > 0 ? stats.failCount / stats.count : 0;
    delete (stats as any).amounts; // 임시 배열 제거
  });
  
  return userStats as any;
}

/**
 * 상점별 통계 계산
 */
export function calculateMerchantStats(dataframe: any[], merchantKey: string = "merchant_id"): {
  [merchantId: string]: {
    count: number;
    totalAmount: number;
    avgAmount: number;
    maxAmount: number;
    minAmount: number;
  };
} {
  const merchantStats: {
    [merchantId: string]: {
      count: number;
      totalAmount: number;
      avgAmount: number;
      maxAmount: number;
      minAmount: number;
    };
  } = {};
  
  dataframe.forEach((row) => {
    const merchantId = row[merchantKey];
    if (!merchantId) return;
    
    if (!merchantStats[merchantId]) {
      merchantStats[merchantId] = {
        count: 0,
        totalAmount: 0,
        avgAmount: 0,
        maxAmount: 0,
        minAmount: Infinity,
      };
    }
    
    const stats = merchantStats[merchantId];
    stats.count++;
    
    const amount = row.amount || 0;
    stats.totalAmount += amount;
    stats.maxAmount = Math.max(stats.maxAmount, amount);
    stats.minAmount = Math.min(stats.minAmount, amount);
  });
  
  // 평균 계산
  Object.keys(merchantStats).forEach((merchantId) => {
    const stats = merchantStats[merchantId];
    stats.avgAmount = stats.count > 0 ? stats.totalAmount / stats.count : 0;
  });
  
  return merchantStats;
}

