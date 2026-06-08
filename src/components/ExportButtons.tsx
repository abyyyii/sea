import { motion } from 'framer-motion';
import { ContainerData } from '@/types/container';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonsProps {
  data: ContainerData[];
  disabled?: boolean;
}

export function ExportButtons({ data, disabled }: ExportButtonsProps) {
  const exportToExcel = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const XLSX = (window as any).XLSX as typeof import('xlsx');
      
      const worksheetData = [
        ['Container Number', 'Shipping Line', 'Current Location', 'Vessel Name', 'Voyage Number', 'ETA', 'Last Update', 'Status', 'Error'],
        ...data.map(container => [
          container.containerNumber,
          container.shippingLine,
          container.currentLocation,
          container.vesselName,
          container.voyageNumber,
          container.eta,
          container.lastUpdate,
          container.status,
          container.error || ''
        ])
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tracking Results');
      
      const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `container_tracking_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('Excel file downloaded!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export');
    }
  };

  const exportToCSV = () => {
    try {
      const headers = [
        'Container Number', 'Shipping Line', 'Current Location', 'Vessel Name',
        'Voyage Number', 'ETA', 'Last Update', 'Status', 'Error'
      ];
      
      const rows = data.map(container => [
        container.containerNumber, container.shippingLine, container.currentLocation,
        container.vesselName, container.voyageNumber, container.eta,
        container.lastUpdate, container.status, container.error || ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `container_tracking_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('CSV file downloaded!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export');
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={exportToExcel}
          disabled={disabled || data.length === 0}
          size="sm"
          className="gap-2 rounded-xl bg-status-arrived hover:bg-status-arrived/90 text-white shadow-md shadow-status-arrived/20"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span className="hidden sm:inline">Excel</span>
        </Button>
      </motion.div>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={exportToCSV}
          disabled={disabled || data.length === 0}
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">CSV</span>
        </Button>
      </motion.div>
    </div>
  );
}
