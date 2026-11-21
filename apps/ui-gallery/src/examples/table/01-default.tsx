import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@forgeron/ui";

const invoices = [
  { id: "INV-2041", status: "Paid", method: "Card", amount: "€1,240.00" },
  { id: "INV-2040", status: "Pending", method: "Transfer", amount: "€86.50" },
  { id: "INV-2039", status: "Paid", method: "Card", amount: "€3,912.00" },
];

export default function Composed() {
  return (
    <div style={{ width: 460 }}>
      <Table>
        <TableCaption>Recent invoices.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead style={{ textAlign: "end" }}>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>{invoice.id}</TableCell>
              <TableCell>{invoice.status}</TableCell>
              <TableCell>{invoice.method}</TableCell>
              <TableCell style={{ textAlign: "end" }}>{invoice.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell style={{ textAlign: "end" }}>€5,238.50</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
