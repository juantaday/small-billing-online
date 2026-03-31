/**
 * Page: Orders
 * Lista de pedido desde carrito con flujo de facturación
 */

import { useMemo, useState } from 'react';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import {
  CardType,
  CustomerCategoryDto,
  CustomerWithRelationsDto,
  IdentityType,
  PaymentMethodType,
  PersonType,
} from '@small-billing/shared';
import { useAuth } from '@/features/auth';
import { useCart } from '@/features/cart';
import { bankApi } from '@/entities/bank';
import { customerApi } from '@/entities/customer';
import { customerCategoryApi } from '@/entities/customer-category/api/customer-category-api';
import { saleApi } from '@/entities/sale';
import { Button, Card, Input, Modal, ToastContainer, useToast } from '@/shared/ui';
import { formatCurrency, logger, resolveImageUrl } from '@/shared/lib';
import { useToastContext } from '@/app/providers/toast/ToastProvider';

interface PaymentDraft {
  id: string;
  paymentType: PaymentMethodType;
  amount: string;
  cashReceived: string;
  bankId: string;
  bankAccount: string;
  transferReference: string;
  cardType: CardType | '';
  voucherNumber: string;
  notes: string;
}

const CARD_OPTIONS: CardType[] = [
  CardType.VISA,
  CardType.MASTERCARD,
  CardType.AMERICAN_EXPRESS,
  CardType.DINERS_CLUB,
  CardType.DISCOVER,
  CardType.OTHER,
];

function makePaymentDraft(defaultAmount = ''): PaymentDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    paymentType: PaymentMethodType.CASH,
    amount: defaultAmount,
    cashReceived: '',
    bankId: '',
    bankAccount: '',
    transferReference: '',
    cardType: '',
    voucherNumber: '',
    notes: '',
  };
}

export function OrdersPage() {
  const { role, user } = useAuth();
  const { items, updateQuantity, removeItem, clearCart, total, itemCount } = useCart();
  const { toasts, removeToast } = useToast();
  const { success, error } = useToastContext();


  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithRelationsDto | null>(null);
  const [isResolvingCustomer, setIsResolvingCustomer] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerWithRelationsDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [categories, setCategories] = useState<CustomerCategoryDto[]>([]);
  const [newCustomerCategoryId, setNewCustomerCategoryId] = useState('');
  const [newCustomer, setNewCustomer] = useState<{
    firstName: string;
    lastName: string;
    rucCi: string;
    mainEmail: string;
    phone: string;
    address: string;
    identityType: IdentityType;
  }>({
    firstName: '',
    lastName: '',
    rucCi: '',
    mainEmail: '',
    phone: '',
    address: '',
    identityType: IdentityType.CEDULA,
  });

  const [banks, setBanks] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [payments, setPayments] = useState<PaymentDraft[]>([makePaymentDraft(total.toFixed(2))]);
  const [notes, setNotes] = useState('');

  const paymentTotal = useMemo(
    () =>
      payments.reduce((acc, payment) => {
        const value = Number(payment.amount || 0);
        if (Number.isNaN(value)) return acc;
        return acc + value;
      }, 0),
    [payments],
  );

  const pendingAmount = Number((total - paymentTotal).toFixed(2));

  const resetCheckout = () => {
    setSelectedCustomer(null);
    setSearchTerm('');
    setSearchResults([]);
    setShowCreateCustomer(false);
    setNotes('');
    setPayments([makePaymentDraft(total.toFixed(2))]);
  };

  const openCheckout = async () => {
    setIsCheckoutOpen(true);
    resetCheckout();

    try {
      const [banksData, categoriesData] = await Promise.all([
        bankApi.getAll(),
        customerCategoryApi.getAll(),
      ]);

      setBanks(banksData);
      setCategories(categoriesData);
      setNewCustomerCategoryId(categoriesData[0]?.id || '');
    } catch (checkoutError) {
      logger.error('Error loading checkout catalogs', checkoutError);
      error('Error de carga', 'No se pudieron cargar bancos o categorías.');
    }

    if (role === 'Customer' && user?.id) {
      setIsResolvingCustomer(true);
      try {
        const ownCustomer = await customerApi.getByUserId(user.id);
        if (ownCustomer) {
          setSelectedCustomer(ownCustomer);
        } else {
          error('Cliente no vinculado', 'Tu usuario no tiene cliente vinculado, selecciona uno manualmente.');
        }
      } catch (resolveError) {
        logger.error('Error resolving customer by user', resolveError, { userId: user.id });
        error('Error', 'No se pudo resolver el cliente del usuario autenticado.');
      } finally {
        setIsResolvingCustomer(false);
      }
    }
  };

  const searchCustomers = async () => {
    const query = searchTerm.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const found = await customerApi.search(query);
      setSearchResults(found);
      if (found.length === 0) {
        success('Sin resultados', 'No se encontraron clientes, puedes crearlo ahora.');
      }
    } catch (searchError) {
      logger.error('Error searching customers', searchError, { query });
      error('Error de búsqueda', 'No fue posible buscar clientes.');
    } finally {
      setIsSearching(false);
    }
  };

  const createCustomerAndAssign = async () => {
    if (!newCustomer.firstName.trim() || !newCustomer.rucCi.trim() || !newCustomerCategoryId) {
      error('Datos incompletos', 'Nombre, identificación y categoría son obligatorios.');
      return;
    }

    try {
      const created = await customerApi.create({
        people: {
          firstName: newCustomer.firstName.trim(),
          lastName: newCustomer.lastName.trim() || undefined,
          rucCi: newCustomer.rucCi.trim(),
          mainEmail: newCustomer.mainEmail.trim() || undefined,
          phone: newCustomer.phone.trim() || undefined,
          address: newCustomer.address.trim() || undefined,
          identityType: newCustomer.identityType,
          personType: PersonType.NATURAL,
        },
        customerCategoryId: newCustomerCategoryId,
      });

      const full = await customerApi.getById(created.id);
      setSelectedCustomer(full);
      setShowCreateCustomer(false);
      success('Cliente creado', 'Cliente creado y asignado al pedido.');
    } catch (createError) {
      logger.error('Error creating customer in checkout', createError);
      error('Error al crear cliente', 'No se pudo crear y asignar el cliente.');
    }
  };

  const updatePayment = (id: string, patch: Partial<PaymentDraft>) => {
    setPayments((prev) => prev.map((payment) => (payment.id === id ? { ...payment, ...patch } : payment)));
  };

  const addPaymentRow = () => {
    setPayments((prev) => [...prev, makePaymentDraft('0')]);
  };

  const removePaymentRow = (id: string) => {
    setPayments((prev) => (prev.length === 1 ? prev : prev.filter((payment) => payment.id !== id)));
  };

  const handleCheckout = async () => {
    console.log('Iniciando proceso de facturación con los siguientes datos');
    if (!user?.id) {
      error('Sesión inválida', 'No se encontró usuario autenticado.');
      return;
    }

    console.log('Validando datos de cliente y pagos antes de crear la venta');
    if (!selectedCustomer?.id) {
      error('Cliente requerido', 'Debes seleccionar o crear un cliente para facturar.');
      return;
    }

    console.log('Verificando monto pendiente');

    if (Math.abs(pendingAmount) > 0.01) {
      error('Pagos incompletos', 'La suma de pagos debe ser igual al total del pedido.');
      return;
    }

    const parsedPayments = payments.map((payment) => ({
      paymentType: payment.paymentType,
      amount: Number(payment.amount || 0),
      cashReceived: payment.cashReceived ? Number(payment.cashReceived) : undefined,
      bankId: payment.bankId || undefined,
      bankAccount: payment.bankAccount || undefined,
      transferReference: payment.transferReference || undefined,
      cardType: payment.cardType || undefined,
      voucherNumber: payment.voucherNumber || undefined,
      notes: payment.notes || undefined,
    }));

    console.log('Validando cada método de pago para verificar que la información sea correcta y completa');

    try {
      for (const payment of parsedPayments) {
        if (payment.amount <= 0) {
          error('Pago inválido', 'Todos los métodos de pago deben tener monto mayor a cero.');
          return;
        }

        if (payment.paymentType === PaymentMethodType.CASH) {
          if (payment.cashReceived === undefined || Number.isNaN(payment.cashReceived)) {
            error('Efectivo inválido', 'Debes ingresar el valor recibido en efectivo.');
            return;
          }
          if (payment.cashReceived < payment.amount) {
            error('Efectivo insuficiente', 'El efectivo recibido no cubre el monto del pago.');
            return;
          }
        }

        if (payment.paymentType === PaymentMethodType.TRANSFER) {
          if (!payment.bankId || !payment.transferReference) {
            console.log('Transferencia incompleta', 'Selecciona banco e ingresa número de transferencia.');
            error('Transferencia incompleta', 'Selecciona banco e ingresa número de transferencia.');
            return;
          }
        }

        if (payment.paymentType === PaymentMethodType.CARD && !payment.voucherNumber) {
          console.log('Tarjeta incompleta', 'Debes ingresar número de voucher.');
          error('Tarjeta incompleta', 'Debes ingresar número de voucher.');
          return;
        }
      }
    } catch (validationError) {
      error('Error de validación', 'Ocurrió un error al validar los métodos de pago.');
      logger.error('Error validating payments in checkout', validationError); 
    }



    console.log('Todos los datos validados, procediendo a crear la venta con saleApi.create');
    setIsSubmitting(true);
    try {

      console.log('Creando venta con los siguientes datos:')
      const created = await saleApi.create({
        customerId: selectedCustomer.id,
        userId: user.id,
        details: items.map((item) => ({
          presentationId: item.presentationId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        payments: parsedPayments,
        notes: notes || undefined,
      });

      clearCart();
      setIsCheckoutOpen(false);
      success('Pedido facturado', `Factura ${created.invoiceNumber} registrada correctamente.`);
    } catch (checkoutError) {
      logger.error('Error creating sale from orders', checkoutError);
      error('No se pudo facturar', checkoutError instanceof Error ? checkoutError.message : 'Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Mi Pedido</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {itemCount} {itemCount === 1 ? 'unidad' : 'unidades'} en carrito
            </p>
          </div>

          {items.length > 0 && (
            <Button variant="ghost" onClick={clearCart}>
              Vaciar carrito
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <Card className="p-10 text-center">
            <ShoppingCart className="w-14 h-14 mx-auto text-gray-400 mb-3" />
            <p className="text-lg font-semibold text-gray-900 dark:text-white">Tu pedido está vacío</p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Agrega productos desde el menú para empezar.</p>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item: (typeof items)[number]) => (
                <Card key={item.id} className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <img
                      src={resolveImageUrl(item.imageUrl)}
                      alt={item.productName}
                      className="w-full sm:w-24 h-24 object-cover rounded-lg bg-gray-100 dark:bg-gray-800"
                    />

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{item.productName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Presentación: {item.presentationName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        Precio unitario: {formatCurrency(item.unitPrice)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-l-lg"
                          aria-label="Restar cantidad"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-r-lg"
                          aria-label="Sumar cantidad"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        aria-label="Eliminar del pedido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      Subtotal: {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between text-xl font-bold">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-red-600 dark:text-red-400">{formatCurrency(total)}</span>
              </div>

              <Button fullWidth size="lg" onClick={openCheckout}>
                Terminar pedido
              </Button>
            </Card>
          </>
        )}
      </div>

      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="Facturar pedido"
        size="2xl"
      >
        <div className="space-y-6">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">1. Cliente</h3>

            {isResolvingCustomer ? (
              <p className="text-sm text-gray-500">Resolviendo cliente del usuario autenticado...</p>
            ) : selectedCustomer ? (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="font-medium text-green-800 dark:text-green-200">
                  {selectedCustomer.people?.firstName} {selectedCustomer.people?.lastName}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  CI/RUC: {selectedCustomer.people?.rucCi}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar por RUC, cédula, nombres o apellidos"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                  <Button onClick={searchCustomers} disabled={isSearching}>
                    Buscar
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {searchResults.map((customer) => (
                      <button
                        type="button"
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <p className="font-medium text-gray-900 dark:text-white">
                          {customer.people?.firstName} {customer.people?.lastName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{customer.people?.rucCi}</p>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">¿No existe el cliente?</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateCustomer((prev) => !prev)}
                  >
                    {showCreateCustomer ? 'Ocultar formulario' : 'Agregar cliente'}
                  </Button>
                </div>

                {showCreateCustomer && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Input
                      label="Nombre"
                      value={newCustomer.firstName}
                      onChange={(event) =>
                        setNewCustomer((prev) => ({ ...prev, firstName: event.target.value }))
                      }
                    />
                    <Input
                      label="Apellido"
                      value={newCustomer.lastName}
                      onChange={(event) =>
                        setNewCustomer((prev) => ({ ...prev, lastName: event.target.value }))
                      }
                    />
                    <Input
                      label="RUC/Cédula"
                      value={newCustomer.rucCi}
                      onChange={(event) =>
                        setNewCustomer((prev) => ({ ...prev, rucCi: event.target.value }))
                      }
                    />
                    <Input
                      label="Email"
                      value={newCustomer.mainEmail}
                      onChange={(event) =>
                        setNewCustomer((prev) => ({ ...prev, mainEmail: event.target.value }))
                      }
                    />
                    <Input
                      label="Teléfono"
                      value={newCustomer.phone}
                      onChange={(event) =>
                        setNewCustomer((prev) => ({ ...prev, phone: event.target.value }))
                      }
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tipo de identidad
                      </label>
                      <select
                        value={newCustomer.identityType}
                        onChange={(event) =>
                          setNewCustomer((prev) => ({
                            ...prev,
                            identityType: event.target.value as IdentityType,
                          }))
                        }
                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value={IdentityType.CEDULA}>Cédula</option>
                        <option value={IdentityType.RUC}>RUC</option>
                        <option value={IdentityType.PASAPORTE}>Pasaporte</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Categoría
                      </label>
                      <select
                        value={newCustomerCategoryId}
                        onChange={(event) => setNewCustomerCategoryId(event.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                      <Button onClick={createCustomerAndAssign}>
                        Crear y asignar cliente
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">2. Métodos de pago</h3>
              <Button variant="outline" size="sm" onClick={addPaymentRow}>
                Agregar método
              </Button>
            </div>

            <div className="space-y-4">
              {payments.map((payment) => {
                const amount = Number(payment.amount || 0);
                const cashReceived = Number(payment.cashReceived || 0);
                const change =
                  payment.paymentType === PaymentMethodType.CASH
                    ? Number((cashReceived - amount).toFixed(2))
                    : 0;

                return (
                  <div key={payment.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tipo
                        </label>
                        <select
                          value={payment.paymentType}
                          onChange={(event) =>
                            updatePayment(payment.id, {
                              paymentType: event.target.value as PaymentMethodType,
                              cashReceived: '',
                              bankId: '',
                              bankAccount: '',
                              transferReference: '',
                              cardType: '',
                              voucherNumber: '',
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value={PaymentMethodType.CASH}>Efectivo</option>
                          <option value={PaymentMethodType.TRANSFER}>Transferencia</option>
                          <option value={PaymentMethodType.CARD}>Tarjeta débito/crédito</option>
                          <option value={PaymentMethodType.CREDIT}>Crédito</option>
                        </select>
                      </div>

                      <Input
                        label="Monto"
                        type="number"
                        min="0"
                        step="0.01"
                        value={payment.amount}
                        onChange={(event) => updatePayment(payment.id, { amount: event.target.value })}
                      />

                      <div className="flex items-end justify-end">
                        <Button variant="danger" onClick={() => removePaymentRow(payment.id)}>
                          Quitar
                        </Button>
                      </div>
                    </div>

                    {payment.paymentType === PaymentMethodType.CASH && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          label="Valor recibido"
                          type="number"
                          min="0"
                          step="0.01"
                          value={payment.cashReceived}
                          onChange={(event) =>
                            updatePayment(payment.id, { cashReceived: event.target.value })
                          }
                        />
                        <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Vuelto</span>
                          <span className={`font-semibold ${change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(change > 0 ? change : 0)}
                          </span>
                        </div>
                      </div>
                    )}

                    {payment.paymentType === PaymentMethodType.TRANSFER && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Banco
                          </label>
                          <select
                            value={payment.bankId}
                            onChange={(event) => updatePayment(payment.id, { bankId: event.target.value })}
                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="">Seleccione banco</option>
                            {banks.map((bank) => (
                              <option key={bank.id} value={bank.id}>
                                {bank.code} - {bank.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Input
                          label="Cuenta"
                          value={payment.bankAccount}
                          onChange={(event) => updatePayment(payment.id, { bankAccount: event.target.value })}
                        />
                        <Input
                          label="Nro transferencia"
                          value={payment.transferReference}
                          onChange={(event) =>
                            updatePayment(payment.id, { transferReference: event.target.value })
                          }
                        />
                      </div>
                    )}

                    {payment.paymentType === PaymentMethodType.CARD && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tarjeta
                          </label>
                          <select
                            value={payment.cardType}
                            onChange={(event) =>
                              updatePayment(payment.id, { cardType: event.target.value as CardType })
                            }
                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="">Seleccione tipo</option>
                            {CARD_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Input
                          label="Nro voucher"
                          value={payment.voucherNumber}
                          onChange={(event) =>
                            updatePayment(payment.id, { voucherNumber: event.target.value })
                          }
                        />
                      </div>
                    )}

                    <Input
                      label="Notas (opcional)"
                      value={payment.notes}
                      onChange={(event) => updatePayment(payment.id, { notes: event.target.value })}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-4 space-y-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Total pedido</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Total pago</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(paymentTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Pendiente</span>
                <span className={`font-semibold ${Math.abs(pendingAmount) <= 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(pendingAmount)}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <Input
              label="Notas de la factura"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Observaciones internas de la venta"
            />
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button variant="ghost" onClick={() => setIsCheckoutOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCheckout} disabled={isSubmitting || isResolvingCustomer}>
              {isSubmitting ? 'Guardando factura...' : 'Confirmar y facturar'}
            </Button>
          </div>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
