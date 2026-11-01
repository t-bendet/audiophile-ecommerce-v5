// shadcn dashboard-01 block, adapted: the three numbers #326 specifies.
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import currencyFormatter from "@/utils/formatters";
import type { Stats } from "../data";

export function SectionCards({ stats }: { stats: Stats }) {
  const cards = [
    {
      label: "Orders",
      value: String(stats.ordersCount),
      delta: "+12.5%",
      up: true,
      note: "Orders placed in the period",
    },
    {
      label: "Revenue",
      value: currencyFormatter(stats.revenue),
      delta: "+8.1%",
      up: true,
      note: "Sum of paid orders",
    },
    {
      label: "New customers",
      value: String(stats.newUsers),
      delta: "-20%",
      up: false,
      note: "Accounts created in the period",
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-3 dark:*:data-[slot=card]:bg-card">
      {cards.map((card) => (
        <Card key={card.label} data-slot="card" className="@container/card">
          <CardHeader>
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {card.value}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {card.up ? <IconTrendingUp /> : <IconTrendingDown />}
                {card.delta}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              vs previous period{" "}
              {card.up ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              )}
            </div>
            <div className="text-muted-foreground">{card.note}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
