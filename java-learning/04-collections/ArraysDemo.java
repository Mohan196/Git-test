import java.util.Arrays;

public class ArraysDemo {
    public static void main(String[] args) {
        // Arrays have a fixed size, set at creation time
        int[] numbers = {5, 2, 8, 1, 9};

        System.out.println("Original: " + Arrays.toString(numbers));

        Arrays.sort(numbers);
        System.out.println("Sorted: " + Arrays.toString(numbers));

        int sum = 0;
        for (int n : numbers) {
            sum += n;
        }
        System.out.println("Sum: " + sum);
        System.out.println("Length: " + numbers.length); // note: property, not a method

        // 2D array
        int[][] grid = {
            {1, 2, 3},
            {4, 5, 6}
        };
        for (int[] row : grid) {
            System.out.println(Arrays.toString(row));
        }
    }
}
