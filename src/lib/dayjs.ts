import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/ko";

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.locale("ko");

export default dayjs;
