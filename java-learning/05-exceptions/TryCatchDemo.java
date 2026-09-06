public class TryCatchDemo {
    public static void main(String[] args) {
        // Exceptions let you handle errors without crashing the whole program
        int[] numbers = {1, 2, 3};

        try {
            System.out.println(numbers[5]); // out of bounds
        } catch (ArrayIndexOutOfBoundsException e) {
            System.out.println("Caught an error: " + e.getMessage());
        } finally {
            System.out.println("This always runs, error or not.");
        }

        System.out.println("Program keeps going after the try/catch.");

        // Multiple catch blocks for different error types
        try {
            int result = 10 / 0;
        } catch (ArithmeticException e) {
            System.out.println("Can't divide by zero: " + e.getMessage());
        }

        System.out.println(divide(10, 2));
        System.out.println(divide(10, 0)); // handled safely, returns 0
    }

    static int divide(int a, int b) {
        try {
            return a / b;
        } catch (ArithmeticException e) {
            System.out.println("Division failed, returning 0.");
            return 0;
        }
    }
}
