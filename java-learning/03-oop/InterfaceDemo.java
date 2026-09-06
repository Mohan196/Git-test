// An interface defines a contract: a set of methods a class must implement,
// without saying how. Unrelated classes can share an interface.
interface Payable {
    double calculatePay();
}

class Employee implements Payable {
    private double hoursWorked;
    private double hourlyRate;

    public Employee(double hoursWorked, double hourlyRate) {
        this.hoursWorked = hoursWorked;
        this.hourlyRate = hourlyRate;
    }

    @Override
    public double calculatePay() {
        return hoursWorked * hourlyRate;
    }
}

class Freelancer implements Payable {
    private double flatFee;

    public Freelancer(double flatFee) {
        this.flatFee = flatFee;
    }

    @Override
    public double calculatePay() {
        return flatFee;
    }
}

public class InterfaceDemo {
    public static void main(String[] args) {
        Payable[] people = {
            new Employee(40, 25.0),
            new Freelancer(500.0)
        };

        // We don't care what kind of Payable it is — just that it can calculatePay()
        for (Payable p : people) {
            System.out.println("Pay: $" + p.calculatePay());
        }
    }
}
