import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const description = "An interactive area chart";

const chartData = [
  { date: "2024-04-01", orders: 222, paid: 150 },
  { date: "2024-04-02", orders: 97, paid: 180 },
  { date: "2024-04-03", orders: 167, paid: 120 },
  { date: "2024-04-04", orders: 242, paid: 260 },
  { date: "2024-04-05", orders: 373, paid: 290 },
  { date: "2024-04-06", orders: 301, paid: 340 },
  { date: "2024-04-07", orders: 245, paid: 180 },
  { date: "2024-04-08", orders: 409, paid: 320 },
  { date: "2024-04-09", orders: 59, paid: 110 },
  { date: "2024-04-10", orders: 261, paid: 190 },
  { date: "2024-04-11", orders: 327, paid: 350 },
  { date: "2024-04-12", orders: 292, paid: 210 },
  { date: "2024-04-13", orders: 342, paid: 380 },
  { date: "2024-04-14", orders: 137, paid: 220 },
  { date: "2024-04-15", orders: 120, paid: 170 },
  { date: "2024-04-16", orders: 138, paid: 190 },
  { date: "2024-04-17", orders: 446, paid: 360 },
  { date: "2024-04-18", orders: 364, paid: 410 },
  { date: "2024-04-19", orders: 243, paid: 180 },
  { date: "2024-04-20", orders: 89, paid: 150 },
  { date: "2024-04-21", orders: 137, paid: 200 },
  { date: "2024-04-22", orders: 224, paid: 170 },
  { date: "2024-04-23", orders: 138, paid: 230 },
  { date: "2024-04-24", orders: 387, paid: 290 },
  { date: "2024-04-25", orders: 215, paid: 250 },
  { date: "2024-04-26", orders: 75, paid: 130 },
  { date: "2024-04-27", orders: 383, paid: 420 },
  { date: "2024-04-28", orders: 122, paid: 180 },
  { date: "2024-04-29", orders: 315, paid: 240 },
  { date: "2024-04-30", orders: 454, paid: 380 },
  { date: "2024-05-01", orders: 165, paid: 220 },
  { date: "2024-05-02", orders: 293, paid: 310 },
  { date: "2024-05-03", orders: 247, paid: 190 },
  { date: "2024-05-04", orders: 385, paid: 420 },
  { date: "2024-05-05", orders: 481, paid: 390 },
  { date: "2024-05-06", orders: 498, paid: 520 },
  { date: "2024-05-07", orders: 388, paid: 300 },
  { date: "2024-05-08", orders: 149, paid: 210 },
  { date: "2024-05-09", orders: 227, paid: 180 },
  { date: "2024-05-10", orders: 293, paid: 330 },
  { date: "2024-05-11", orders: 335, paid: 270 },
  { date: "2024-05-12", orders: 197, paid: 240 },
  { date: "2024-05-13", orders: 197, paid: 160 },
  { date: "2024-05-14", orders: 448, paid: 490 },
  { date: "2024-05-15", orders: 473, paid: 380 },
  { date: "2024-05-16", orders: 338, paid: 400 },
  { date: "2024-05-17", orders: 499, paid: 420 },
  { date: "2024-05-18", orders: 315, paid: 350 },
  { date: "2024-05-19", orders: 235, paid: 180 },
  { date: "2024-05-20", orders: 177, paid: 230 },
  { date: "2024-05-21", orders: 82, paid: 140 },
  { date: "2024-05-22", orders: 81, paid: 120 },
  { date: "2024-05-23", orders: 252, paid: 290 },
  { date: "2024-05-24", orders: 294, paid: 220 },
  { date: "2024-05-25", orders: 201, paid: 250 },
  { date: "2024-05-26", orders: 213, paid: 170 },
  { date: "2024-05-27", orders: 420, paid: 460 },
  { date: "2024-05-28", orders: 233, paid: 190 },
  { date: "2024-05-29", orders: 78, paid: 130 },
  { date: "2024-05-30", orders: 340, paid: 280 },
  { date: "2024-05-31", orders: 178, paid: 230 },
  { date: "2024-06-01", orders: 178, paid: 200 },
  { date: "2024-06-02", orders: 470, paid: 410 },
  { date: "2024-06-03", orders: 103, paid: 160 },
  { date: "2024-06-04", orders: 439, paid: 380 },
  { date: "2024-06-05", orders: 88, paid: 140 },
  { date: "2024-06-06", orders: 294, paid: 250 },
  { date: "2024-06-07", orders: 323, paid: 370 },
  { date: "2024-06-08", orders: 385, paid: 320 },
  { date: "2024-06-09", orders: 438, paid: 480 },
  { date: "2024-06-10", orders: 155, paid: 200 },
  { date: "2024-06-11", orders: 92, paid: 150 },
  { date: "2024-06-12", orders: 492, paid: 420 },
  { date: "2024-06-13", orders: 81, paid: 130 },
  { date: "2024-06-14", orders: 426, paid: 380 },
  { date: "2024-06-15", orders: 307, paid: 350 },
  { date: "2024-06-16", orders: 371, paid: 310 },
  { date: "2024-06-17", orders: 475, paid: 520 },
  { date: "2024-06-18", orders: 107, paid: 170 },
  { date: "2024-06-19", orders: 341, paid: 290 },
  { date: "2024-06-20", orders: 408, paid: 450 },
  { date: "2024-06-21", orders: 169, paid: 210 },
  { date: "2024-06-22", orders: 317, paid: 270 },
  { date: "2024-06-23", orders: 480, paid: 530 },
  { date: "2024-06-24", orders: 132, paid: 180 },
  { date: "2024-06-25", orders: 141, paid: 190 },
  { date: "2024-06-26", orders: 434, paid: 380 },
  { date: "2024-06-27", orders: 448, paid: 490 },
  { date: "2024-06-28", orders: 149, paid: 200 },
  { date: "2024-06-29", orders: 103, paid: 160 },
  { date: "2024-06-30", orders: 446, paid: 400 },
];

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  orders: {
    label: "Orders",
    color: "var(--primary)",
  },
  paid: {
    label: "Paid",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");

  React.useEffect(() => {
    if (isMobile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- block code as installed
      setTimeRange("7d");
    }
  }, [isMobile]);

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date);
    const referenceDate = new Date("2024-06-30");
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    return date >= startDate;
  });

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Orders per day and how many were paid, last 3 months
          </span>
          <span className="@[540px]/card:hidden">Last 3 months</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-orders)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-orders)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="mobile"
              type="natural"
              fill="url(#fillMobile)"
              stroke="var(--color-mobile)"
              stackId="a"
            />
            <Area
              dataKey="orders"
              type="natural"
              fill="url(#fillDesktop)"
              stroke="var(--color-orders)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
