import { useState, useEffect } from 'react';
import { Printer, Plus, Trash2, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'simple_invoice_v1';

const App = () => {
  // 今日の日付を取得
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const defaultDate = today.toISOString().substr(0, 10);

  // デフォルトの請求書番号（YYYYMM-01形式）
  const defaultInvoiceNumber = `${yyyy}${mm}-01`;

  // --- 初期データ定義 ---
  const initialInvoiceData = {
    invoiceNumber: defaultInvoiceNumber,
    date: defaultDate,
    dueDate: '',

    // 発行者（自分）
    senderName: '山田 太郎',
    senderAddress: '東京都渋谷区...',
    senderRegNum: 'T1234567890123', // インボイス番号
    senderBank: '○○銀行 ××支店 普通 1234567',

    // 宛先（クライアント）
    clientName: '株式会社 クライアント',

    // 計算設定
    taxRate: 10,
    enableWithholding: false, // 源泉徴収の有無

    // 明細
    items: [
      { id: 1, name: 'システム開発費（10月度）', quantity: 1, unit: '式', price: 100000 },
    ]
  };

  // --- State管理 ---
  const [data, setData] = useState(initialInvoiceData);
  const [isLoaded, setIsLoaded] = useState(false);

  // --- 永続化（LocalStorage） ---
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        setData(JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isLoaded]);

  // --- 計算ロジック ---
  const subtotal = data.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const taxAmount = Math.floor(subtotal * (data.taxRate / 100));

  // 源泉徴収税額（10.21%で計算：100万円以下を想定した簡易計算）
  const withholdingAmount = data.enableWithholding ? Math.floor(subtotal * 0.1021) : 0;

  const totalAmount = subtotal + taxAmount - withholdingAmount;

  // --- イベントハンドラ ---
  const handleChange = (key, value) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleItemChange = (id, field, value) => {
    const newItems = data.items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      name: '',
      quantity: 1,
      unit: '式',
      price: 0
    };
    setData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeItem = (id) => {
    setData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    if (window.confirm('現在の入力内容を初期状態に戻しますか？（保存されたデータもリセットされます）')) {
      // リセット時も現在の日付に基づいて番号を再生成
      const resetDate = new Date();
      const resetYyyy = resetDate.getFullYear();
      const resetMm = String(resetDate.getMonth() + 1).padStart(2, '0');

      setData({
        ...initialInvoiceData,
        invoiceNumber: `${resetYyyy}${resetMm}-01`,
        date: resetDate.toISOString().substr(0, 10)
      });
    }
  };

  // --- UIコンポーネント ---

  // 編集可能なテキスト入力エリア（印刷時は枠線が消える）
  const EditableInput = ({ value, onChange, className = "", placeholder = "", type = "text", align = "left" }) => {
    const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
    return (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-400 focus:bg-white focus:outline-none rounded px-1 w-full transition-colors print:border-none print:p-0 ${className} ${alignClass}`}
      />
    );
  };

  const EditableTextarea = ({ value, onChange, className = "", placeholder = "" }) => (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className={`bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-400 focus:bg-white focus:outline-none rounded px-1 w-full resize-none transition-colors print:border-none print:resize-none print:p-0 ${className}`}
    />
  );

  if (!isLoaded) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white font-sans text-gray-800">

      {/* 印刷用スタイル（ブラウザの余白やヘッダーフッターを強制削除） */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* 操作バー（印刷時は非表示） */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <h1 className="text-xl font-bold text-gray-700">Simple Invoice</h1>
        <div className="flex gap-3">
          <button onClick={handleReset} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded transition">
            <RotateCcw size={16} /> リセット
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow transition font-bold">
            <Printer size={18} /> PDF発行 / 印刷
          </button>
        </div>
      </div>

      {/* A4用紙エリア */}
      {/* print:p-[15mm] -> 印刷時も画面と同じ余白を確保
          print:w-[210mm] -> A4幅に固定
          print:h-[297mm] -> A4高さに固定
          overflow-hidden -> はみ出し防止
      */}
      <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-lg p-[15mm] print:shadow-none print:w-[210mm] print:min-h-[297mm] print:p-[15mm] print:m-0 relative box-border overflow-hidden">

        {/* ヘッダー：タイトルとNo/日付 */}
        <div className="flex justify-between items-start mb-12 border-b-2 border-gray-800 pb-4">
          <h2 className="text-3xl font-bold tracking-widest text-gray-800">請求書</h2>
          <div className="text-right w-1/3">
            <div className="flex items-center justify-end mb-1">
              <span className="text-sm text-gray-500 w-16 mr-2">No.</span>
              <EditableInput
                value={data.invoiceNumber}
                onChange={(val) => handleChange('invoiceNumber', val)}
                placeholder="202310-01"
                align="right"
                className="font-mono"
              />
            </div>
            <div className="flex items-center justify-end">
              <span className="text-sm text-gray-500 w-16 mr-2">発行日</span>
              <EditableInput
                type="date"
                value={data.date}
                onChange={(val) => handleChange('date', val)}
                align="right"
                className="font-mono"
              />
            </div>
          </div>
        </div>

        {/* 宛名と発行者情報 */}
        <div className="flex justify-between mb-12 flex-wrap sm:flex-nowrap gap-8">

          {/* 左側：宛名 */}
          <div className="w-full sm:w-1/2">
            <div className="border-b border-gray-400 pb-2 mb-2">
              <EditableInput
                value={data.clientName}
                onChange={(val) => handleChange('clientName', val)}
                placeholder="顧客名を入力"
                className="text-xl font-bold"
              />
              <span className="text-gray-800 ml-1">御中</span>
            </div>
            <div className="mt-6">
              <div className="flex items-center mb-2">
                <span className="text-sm font-bold border-b border-gray-800 pb-1">ご請求金額</span>
              </div>
              <div className="text-3xl font-bold font-mono">
                ¥{totalAmount.toLocaleString()}
                <span className="text-sm font-normal ml-2 text-gray-500">-</span>
              </div>
            </div>
             <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-500 w-20 whitespace-nowrap">お支払期限</span>
              <EditableInput
                type="date"
                value={data.dueDate}
                onChange={(val) => handleChange('dueDate', val)}
                className="font-mono w-40"
              />
            </div>
          </div>

          {/* 右側：発行者情報 */}
          <div className="w-full sm:w-5/12 text-sm leading-relaxed">
            <EditableInput
              value={data.senderName}
              onChange={(val) => handleChange('senderName', val)}
              className="font-bold text-lg mb-1"
              placeholder="あなたの名前"
              align="right"
            />
            <EditableInput
              value={data.senderAddress}
              onChange={(val) => handleChange('senderAddress', val)}
              className="text-gray-600 mb-2"
              placeholder="住所を入力"
              align="right"
            />
             <div className={`flex justify-end items-center text-gray-600 mb-4 ${!data.senderRegNum ? 'print:hidden' : ''}`}>
              <span className="mr-2 whitespace-nowrap">登録番号:</span>
              <EditableInput
                value={data.senderRegNum}
                onChange={(val) => handleChange('senderRegNum', val)}
                placeholder="T0000000000000"
                className="w-32 font-mono"
                align="right"
              />
            </div>

            {/* 振込先（印字用） */}
            <div className="bg-gray-50 p-3 rounded print:bg-transparent print:p-0 print:border print:border-gray-200 print:mt-2">
              <div className="font-bold mb-1 text-xs text-gray-500">お振込先</div>
              <EditableTextarea
                value={data.senderBank}
                onChange={(val) => handleChange('senderBank', val)}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* 明細テーブル */}
        <div className="mb-8">
          <div className="flex border-b-2 border-gray-800 pb-2 mb-2 text-sm font-bold text-gray-600">
            <div className="flex-grow pl-1">内容</div>
            <div className="w-16 text-center">数量</div>
            <div className="w-16 text-center">単位</div>
            <div className="w-24 text-right">単価</div>
            <div className="w-28 text-right pr-1">金額</div>
            <div className="w-8 print:hidden"></div>
          </div>

          {data.items.map((item) => (
            <div key={item.id} className="flex items-center border-b border-gray-200 py-1 hover:bg-gray-50 transition print:hover:bg-transparent print:border-gray-300">
              <div className="flex-grow">
                <EditableInput
                  value={item.name}
                  onChange={(val) => handleItemChange(item.id, 'name', val)}
                  placeholder="品目名"
                />
              </div>
              <div className="w-16">
                <EditableInput
                  type="number"
                  value={item.quantity}
                  onChange={(val) => handleItemChange(item.id, 'quantity', Number(val))}
                  align="center"
                  className="font-mono"
                />
              </div>
              <div className="w-16">
                <EditableInput
                  value={item.unit}
                  onChange={(val) => handleItemChange(item.id, 'unit', val)}
                  align="center"
                />
              </div>
              <div className="w-24">
                <EditableInput
                  type="number"
                  value={item.price}
                  onChange={(val) => handleItemChange(item.id, 'price', Number(val))}
                  align="right"
                  className="font-mono"
                />
              </div>
              <div className="w-28 text-right font-mono pr-2">
                {(item.quantity * item.price).toLocaleString()}
              </div>
              <div className="w-8 flex justify-center print:hidden">
                {data.items.length > 1 && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-400 hover:text-red-500 transition"
                    title="削除"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* 行追加ボタン（印刷時非表示） */}
          <div className="mt-2 text-center print:hidden">
            <button
              onClick={addItem}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium py-1 px-3 rounded hover:bg-blue-50 transition"
            >
              <Plus size={16} /> 明細行を追加
            </button>
          </div>
        </div>

        {/* 合計計算エリア */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-600">小計</span>
              <span className="font-mono">¥{subtotal.toLocaleString()}</span>
            </div>

            <div className="flex justify-between mb-2 text-sm items-center">
              <span className="text-gray-600">消費税 (10%)</span>
              <span className="font-mono">¥{taxAmount.toLocaleString()}</span>
            </div>

            {/* 源泉徴収の設定（印刷時は金額のみ、または非表示） */}
            <div className="flex justify-between mb-4 text-sm items-center text-gray-600 border-b border-gray-300 pb-2">
              <label className="flex items-center cursor-pointer print:cursor-default">
                <input
                  type="checkbox"
                  checked={data.enableWithholding}
                  onChange={(e) => handleChange('enableWithholding', e.target.checked)}
                  className="mr-2 print:hidden"
                />
                <span className={data.enableWithholding ? "text-gray-600" : "text-gray-300 print:hidden"}>源泉徴収税</span>
              </label>
              {data.enableWithholding && (
                <span className="text-red-500 font-mono">- ¥{withholdingAmount.toLocaleString()}</span>
              )}
            </div>

            <div className="flex justify-between items-end">
              <span className="font-bold">合計</span>
              <span className="text-2xl font-bold font-mono border-b-2 border-gray-800">
                ¥{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 備考欄 */}
        <div className={`mt-12 pt-4 border-t border-gray-200 ${!data.remarks ? 'print:hidden' : ''}`}>
          <div className="text-xs text-gray-500 mb-1">備考</div>
          <EditableTextarea
            value={data.remarks || ''}
            onChange={(val) => handleChange('remarks', val)}
            placeholder="備考欄（例：振込手数料はご負担願います）"
            className="text-sm h-20"
          />
        </div>

      </div>

      <div className="text-center mt-8 text-gray-500 text-xs print:hidden">
        <p>入力内容は自動的にお使いのブラウザに保存されます。</p>
      </div>
    </div>
  );
};

export default App;
