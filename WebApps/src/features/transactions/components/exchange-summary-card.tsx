import { format } from "date-fns";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MasterDataName } from "@/shared/components/master-data-name";
import { StatusBadge } from "@/shared/components/status-badge";
import type { ExchangeDetail } from "../api/types";
import { DetailField, MonoValue } from "./detail-field";

const DATE_FORMAT = "dd MMM yyyy, HH:mm";

/**
 * Every field here is a real `GET /exchanges/:id` field. Factory, Trolley,
 * Operator, Exchange Type and both Needle Types arrive as ids and are resolved
 * to names through the master-data lookup; an id that cannot be resolved still
 * renders as itself rather than as an invented label.
 *
 * Device stays a raw id — there is no `/devices` endpoint to resolve it from.
 */
export function ExchangeSummaryCard({ exchange }: { exchange: ExchangeDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Information</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField label="Exchange Number" value={<MonoValue>{exchange.exchangeNumber}</MonoValue>} />
          <DetailField label="Status" value={<StatusBadge status={exchange.status} />} />
          <DetailField label="Created" value={format(new Date(exchange.createdAt), DATE_FORMAT)} />

          <DetailField
            label="Factory"
            value={<MasterDataName collection="factories" id={exchange.factoryId} />}
          />
          <DetailField
            label="Trolley"
            value={<MasterDataName collection="trolleys" id={exchange.trolleyId} withCode />}
          />
          <DetailField label="Device ID" value={<MonoValue>{exchange.deviceId}</MonoValue>} />

          <DetailField
            label="Operator"
            value={<MasterDataName collection="employees" id={exchange.operatorId} withCode />}
          />
          <DetailField
            label="Exchange Type"
            value={<MasterDataName collection="exchange-types" id={exchange.exchangeTypeId} />}
          />
          <DetailField
            label="Fragment Status"
            value={exchange.fragmentStatus ? <StatusBadge status={exchange.fragmentStatus} /> : "—"}
          />

          <DetailField
            label="Old Needle Type"
            value={<MasterDataName collection="needle-types" id={exchange.oldNeedleTypeId} withCode />}
          />
          <DetailField
            label="New Needle Type"
            value={<MasterDataName collection="needle-types" id={exchange.newNeedleTypeId} withCode />}
          />

          {exchange.completedAt && (
            <DetailField label="Completed" value={format(new Date(exchange.completedAt), DATE_FORMAT)} />
          )}
          {exchange.cancelledAt && (
            <DetailField label="Cancelled" value={format(new Date(exchange.cancelledAt), DATE_FORMAT)} />
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
