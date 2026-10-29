package com.enviro.assessment.junior.eleazar.repository;

import com.enviro.assessment.junior.eleazar.entity.WithdrawalNotice;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;

public interface WithdrawalNoticeRepository extends JpaRepository<WithdrawalNotice, Long>, JpaSpecificationExecutor<WithdrawalNotice> {
    @Query("select coalesce(sum(n.amount), 0) from WithdrawalNotice n where n.product.id = :productId and n.active = true")
    BigDecimal sumActiveAmount(@Param("productId") Long productId);

    interface ReservationTotal {
        Long getProductId();
        BigDecimal getAmount();
    }

    @Query("""
            select n.product.id as productId, sum(n.amount) as amount
            from WithdrawalNotice n
            where n.product.portfolio.investor.id = :investorId and n.active = true
            group by n.product.id
            """)
    List<ReservationTotal> activeTotals(@Param("investorId") Long investorId);

    @Override
    @EntityGraph(attributePaths = "product")
    List<WithdrawalNotice> findAll(Specification<WithdrawalNotice> specification, Sort sort);
}
